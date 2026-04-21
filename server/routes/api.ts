import { Router, Request, Response, NextFunction } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { db } from "../db.ts";

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || "fallback_secret";

// Middleware to authenticate user
export const authenticate = (req: any, res: any, next: NextFunction) => {
  const token = req.cookies.token || req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Unauthorized" });

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ error: "Invalid token" });
  }
};

export const requireAdmin = (req: any, res: any, next: NextFunction) => {
  if (req.user?.role !== "admin") {
    return res.status(403).json({ error: "Forbidden: Admin only" });
  }
  next();
};

/* --- AUTH ROUTES --- */

router.post("/auth/register", (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: "Username and password required" });
  
  try {
    const hash = bcrypt.hashSync(password, 10);
    const result = db.prepare("INSERT INTO users (username, password_hash) VALUES (?, ?)").run(username, hash);
    const token = jwt.sign({ id: result.lastInsertRowid, username, role: "user" }, JWT_SECRET, { expiresIn: "7d" });
    
    res.cookie("token", token, { httpOnly: true, secure: process.env.NODE_ENV === "production" });
    res.json({ message: "Registered", user: { id: result.lastInsertRowid, username, role: "user" }, token });
  } catch (err: any) {
    if (err.message.includes("UNIQUE constraint failed")) {
      return res.status(400).json({ error: "Username already exists" });
    }
    res.status(500).json({ error: "Server error" });
  }
});

router.post("/auth/login", (req, res) => {
  const { username, password } = req.body;
  const user = db.prepare("SELECT * FROM users WHERE username = ?").get(username) as any;
  
  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  const token = jwt.sign({ id: user.id, username: user.username, role: user.role, verified: user.verified }, JWT_SECRET, { expiresIn: "7d" });
  res.cookie("token", token, { httpOnly: true, secure: process.env.NODE_ENV === "production" });
  res.json({ message: "Logged in", user: { id: user.id, username: user.username, role: user.role, verified: user.verified }, token });
});

router.post("/auth/logout", (req, res) => {
  res.clearCookie("token");
  res.json({ message: "Logged out" });
});

router.get("/auth/me", authenticate, (req: any, res) => {
  const user = db.prepare("SELECT id, username, role, verified, karma, created_at FROM users WHERE id = ?").get(req.user.id);
  res.json({ user });
});

/* --- POSTS ROUTES --- */

router.get("/posts", (req, res) => {
  // Simple fetch all posts with their authors and tags
  const { sort = "new", tag } = req.query;
  let queryUrl = `
    SELECT posts.*, users.username, users.verified, tags.name as tag_name,
      (SELECT COUNT(*) FROM comments WHERE comments.post_id = posts.id) as comment_count
    FROM posts 
    LEFT JOIN users ON posts.author_id = users.id
    LEFT JOIN tags ON posts.tag_id = tags.id
  `;
  const params: any[] = [];
  
  if (tag) {
    queryUrl += " WHERE tags.name = ?";
    params.push(tag);
  }

  if (sort === "top") queryUrl += " ORDER BY (posts.upvotes - posts.downvotes) DESC, posts.created_at DESC";
  else if (sort === "hot") queryUrl += " ORDER BY posts.comment_count DESC, posts.created_at DESC";
  else queryUrl += " ORDER BY posts.created_at DESC";

  const posts = db.prepare(queryUrl).all(...params);
  res.json({ posts });
});

router.post("/posts", authenticate, (req: any, res) => {
  const { title, content, tagId } = req.body;
  if (!title) return res.status(400).json({ error: "Title is required" });

  db.transaction(() => {
    const result = db.prepare("INSERT INTO posts (author_id, title, content, tag_id) VALUES (?, ?, ?, ?)").run(req.user.id, title, content || null, tagId || null);
    const postId = result.lastInsertRowid;

    if (content) {
      const mentionRegex = /@([a-zA-Z0-9_]+)/g;
      let match;
      const mentionedUsers = new Set<string>();
      while ((match = mentionRegex.exec(content)) !== null) {
        mentionedUsers.add(match[1]);
      }

      mentionedUsers.forEach(username => {
        const user = db.prepare("SELECT id FROM users WHERE username = ? COLLATE NOCASE").get(username) as any;
        if (user && user.id !== req.user.id) {
          db.prepare("INSERT INTO notifications (user_id, actor_id, type, post_id) VALUES (?, ?, 'mention', ?)")
            .run(user.id, req.user.id, postId);
        }
      });
    }

    res.json({ id: postId });
  })();
});

router.get("/posts/:id", (req, res) => {
  const post = db.prepare(`
    SELECT posts.*, users.username, users.verified, tags.name as tag_name 
    FROM posts 
    LEFT JOIN users ON posts.author_id = users.id 
    LEFT JOIN tags ON posts.tag_id = tags.id 
    WHERE posts.id = ?
  `).get(req.params.id);
  if (!post) return res.status(404).json({ error: "Not found" });
  res.json({ post });
});

/* --- COMMENTS ROUTES --- */

router.get("/posts/:id/comments", (req, res) => {
  const comments = db.prepare(`
    SELECT comments.*, users.username, users.verified 
    FROM comments 
    LEFT JOIN users ON comments.author_id = users.id 
    WHERE comments.post_id = ? 
    ORDER BY comments.created_at ASC
  `).all(req.params.id);
  res.json({ comments });
});

router.post("/posts/:id/comments", authenticate, (req: any, res) => {
  const { content, parentId } = req.body;
  if (!content) return res.status(400).json({ error: "Content required" });
  const postId = req.params.id;
  const authorId = req.user.id;

  db.transaction(() => {
    const result = db.prepare("INSERT INTO comments (post_id, author_id, parent_id, content) VALUES (?, ?, ?, ?)").run(postId, authorId, parentId || null, content);
    const commentId = result.lastInsertRowid;

    // Determine who gets notified for the reply
    if (parentId) {
      // Reply to a comment
      const parentComment = db.prepare("SELECT author_id FROM comments WHERE id = ?").get(parentId) as any;
      if (parentComment && parentComment.author_id !== authorId) {
        db.prepare("INSERT INTO notifications (user_id, actor_id, type, post_id, comment_id) VALUES (?, ?, 'comment_reply', ?, ?)")
          .run(parentComment.author_id, authorId, postId, commentId);
      }
    } else {
      // Reply to the post
      const post = db.prepare("SELECT author_id FROM posts WHERE id = ?").get(postId) as any;
      if (post && post.author_id !== authorId) {
        db.prepare("INSERT INTO notifications (user_id, actor_id, type, post_id, comment_id) VALUES (?, ?, 'post_reply', ?, ?)")
          .run(post.author_id, authorId, postId, commentId);
      }
    }

    // Mentions parsing
    const mentionRegex = /@([a-zA-Z0-9_]+)/g;
    let match;
    const mentionedUsers = new Set<string>();
    while ((match = mentionRegex.exec(content)) !== null) {
      mentionedUsers.add(match[1]);
    }

    mentionedUsers.forEach(username => {
      const user = db.prepare("SELECT id FROM users WHERE username = ? COLLATE NOCASE").get(username) as any;
      // Only notify if user exists and is not the author
      if (user && user.id !== authorId) {
        // Prevent double notification if they were already notified as the parent post/comment author
        // Actually, we could just send them a mention notification anyway, or check to prevent duplicates.
        // Let's keep it simple and just insert.
        db.prepare("INSERT INTO notifications (user_id, actor_id, type, post_id, comment_id) VALUES (?, ?, 'mention', ?, ?)")
          .run(user.id, authorId, postId, commentId);
      }
    });

    res.json({ id: commentId });
  })();
});

/* --- VOTING ROUTES --- */
const handleVote = (req: any, res: Response, targetType: 'post' | 'comment') => {
  const { id } = req.params;
  const { value } = req.body; // 1 or -1 or 0
  
  if (![1, 0, -1].includes(value)) return res.status(400).json({ error: "Invalid vote" });

  const userId = req.user.id;
  const existingVote = db.prepare("SELECT value FROM votes WHERE user_id = ? AND target_id = ? AND target_type = ?").get(userId, id, targetType) as any;
  
  db.transaction(() => {
    // Revert existing vote
    if (existingVote) {
      if (existingVote.value === 1) db.prepare(`UPDATE \${targetType}s SET upvotes = upvotes - 1 WHERE id = ?`).run(id);
      if (existingVote.value === -1) db.prepare(`UPDATE \${targetType}s SET downvotes = downvotes - 1 WHERE id = ?`).run(id);
      db.prepare("DELETE FROM votes WHERE user_id = ? AND target_id = ? AND target_type = ?").run(userId, id, targetType);
    }
    
    // Apply new vote
    if (value !== 0) {
      db.prepare("INSERT INTO votes (user_id, target_id, target_type, value) VALUES (?, ?, ?, ?)").run(userId, id, targetType, value);
      if (value === 1) db.prepare(`UPDATE \${targetType}s SET upvotes = upvotes + 1 WHERE id = ?`).run(id);
      if (value === -1) db.prepare(`UPDATE \${targetType}s SET downvotes = downvotes + 1 WHERE id = ?`).run(id);
    }

    // Update user karma (simplified: applied to author of target)
    const target = db.prepare(`SELECT author_id FROM \${targetType}s WHERE id = ?`).get(id) as any;
    if (target) {
        let karmaDelta = value;
        if (existingVote) karmaDelta -= existingVote.value;
        db.prepare("UPDATE users SET karma = karma + ? WHERE id = ?").run(karmaDelta, target.author_id);
    }
  })();
  
  res.json({ message: "Vote recorded" });
};

router.post("/posts/:id/vote", authenticate, (req, res) => handleVote(req, res, 'post'));
router.post("/comments/:id/vote", authenticate, (req, res) => handleVote(req, res, 'comment'));

/* --- tags & ADMIN --- */
router.get("/tags", (req, res) => {
  const tags = db.prepare("SELECT * FROM tags").all();
  res.json({ tags });
});

router.post("/tags", authenticate, (req: any, res) => {
  const { name } = req.body;
  try {
    const result = db.prepare("INSERT INTO tags (name) VALUES (?)").run(name.toLowerCase());
    res.json({ id: result.lastInsertRowid, name: name.toLowerCase() });
  } catch (err) {
    res.status(400).json({ error: "Tag might already exist" });
  }
});

// Admin User list
router.get("/admin/users", authenticate, requireAdmin, (req, res) => {
  const users = db.prepare("SELECT id, username, role, verified, karma, created_at FROM users ORDER BY created_at DESC").all();
  res.json({ users });
});

// Admin toggle verify
router.post("/admin/users/:id/verify", authenticate, requireAdmin, (req, res) => {
  const { verified } = req.body;
  db.prepare("UPDATE users SET verified = ? WHERE id = ?").run(verified ? 1 : 0, req.params.id);
  res.json({ message: "Updated verified status" });
});

// Admin reset user password manually
router.post("/admin/users/:id/reset-password", authenticate, requireAdmin, (req, res) => {
  const { newPassword } = req.body;
  if (!newPassword) return res.status(400).json({ error: "Password required" });
  const hash = bcrypt.hashSync(newPassword, 10);
  db.prepare("UPDATE users SET password_hash = ? WHERE id = ?").run(hash, req.params.id);
  res.json({ message: "Password reset successfully" });
});

// Admin ban or suspend (simple role change to banned)
router.post("/admin/users/:id/ban", authenticate, requireAdmin, (req, res) => {
  db.prepare("UPDATE users SET role = 'banned' WHERE id = ?").run(req.params.id);
  res.json({ message: "User banned" });
});

// Admin delete post
router.delete("/admin/posts/:id", authenticate, requireAdmin, (req, res) => {
  db.prepare("DELETE FROM posts WHERE id = ?").run(req.params.id);
  // Optional cascade delete comments can be handled at DB level or left orphaned for now
  db.prepare("DELETE FROM comments WHERE post_id = ?").run(req.params.id);
  res.json({ message: "Post deleted" });
});

// Admin delete comment
router.delete("/admin/comments/:id", authenticate, requireAdmin, (req, res) => {
  db.prepare("DELETE FROM comments WHERE id = ?").run(req.params.id);
  res.json({ message: "Comment deleted" });
});

/* --- NOTIFICATIONS ROUTES --- */
router.get("/notifications", authenticate, (req: any, res) => {
  const notifications = db.prepare(`
    SELECT n.*, u.username as actor_username, p.title as post_title 
    FROM notifications n
    JOIN users u ON n.actor_id = u.id
    JOIN posts p ON n.post_id = p.id
    WHERE n.user_id = ?
    ORDER BY n.created_at DESC
    LIMIT 50
  `).all(req.user.id);
  res.json({ notifications });
});

router.post("/notifications/read", authenticate, (req: any, res) => {
  db.prepare("UPDATE notifications SET is_read = 1 WHERE user_id = ? AND is_read = 0").run(req.user.id);
  res.json({ message: "Notifications marked as read" });
});

export default router;
