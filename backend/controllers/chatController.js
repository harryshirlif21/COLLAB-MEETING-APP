const ChatMessage = require("../models/ChatMessage");
const Meeting = require("../models/Meeting");

/**
 * GET /api/meetings/:id/chat
 * Fetch chat history for a meeting
 */
exports.getChatHistory = async (req, res) => {
  const { id } = req.params;
  const { limit = 50, offset = 0 } = req.query;

  try {
    const messages = await ChatMessage.findAll({
      where: { meeting_id: id, deleted_at: null },
      attributes: ["id", "user_id", "content", "edited_at", "created_at"],
      order: [["created_at", "DESC"]],
      limit: Math.min(parseInt(limit), 100),
      offset: parseInt(offset),
      include: [
        {
          association: "User",
          attributes: ["id", "name", "email"],
        },
      ],
    });

    res.json({ success: true, messages: messages.reverse() });
  } catch (err) {
    console.error("[CHAT HISTORY ERROR]", err.message);
    res.status(500).json({ error: err.message });
  }
};

/**
 * POST /api/meetings/:id/chat
 * Send chat message (persisted)
 */
exports.sendMessage = async (req, res) => {
  const { id } = req.params;
  const { content } = req.body;
  const userId = req.user?.id;

  if (!content?.trim()) {
    return res.status(400).json({ error: "Message content required" });
  }

  try {
    const message = await ChatMessage.create({
      meeting_id: id,
      user_id: userId,
      content: content.trim(),
    });

    res.status(201).json({ success: true, message });
  } catch (err) {
    console.error("[SEND MESSAGE ERROR]", err.message);
    res.status(500).json({ error: err.message });
  }
};

/**
 * PUT /api/meetings/:id/chat/:messageId
 * Edit own message
 */
exports.editMessage = async (req, res) => {
  const { id, messageId } = req.params;
  const { content } = req.body;
  const userId = req.user?.id;

  if (!content?.trim()) {
    return res.status(400).json({ error: "Message content required" });
  }

  try {
    const message = await ChatMessage.findOne({
      where: { id: messageId, user_id: userId, meeting_id: id },
    });

    if (!message) {
      return res.status(404).json({ error: "Message not found" });
    }

    await message.update({
      content: content.trim(),
      edited_at: new Date(),
    });

    res.json({ success: true, message });
  } catch (err) {
    console.error("[EDIT MESSAGE ERROR]", err.message);
    res.status(500).json({ error: err.message });
  }
};

/**
 * DELETE /api/meetings/:id/chat/:messageId
 * Delete own message (soft delete)
 */
exports.deleteMessage = async (req, res) => {
  const { id, messageId } = req.params;
  const userId = req.user?.id;

  try {
    const message = await ChatMessage.findOne({
      where: { id: messageId, user_id: userId, meeting_id: id },
    });

    if (!message) {
      return res.status(404).json({ error: "Message not found" });
    }

    await message.update({ deleted_at: new Date() });

    res.json({ success: true, message: "Message deleted" });
  } catch (err) {
    console.error("[DELETE MESSAGE ERROR]", err.message);
    res.status(500).json({ error: err.message });
  }
};
