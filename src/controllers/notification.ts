import { Request, Response } from "express";
import { getMessaging } from "firebase-admin/messaging";

export const sendTestNotification = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { token, title, body } = req.body;

    if (!token) {
      res.status(400).json({
        success: false,
        message: "FCM token is required",
      });
      return;
    }

    const response = await getMessaging().send({
      token,
      notification: {
        title: title || "KrushiMall",
        body: body || "Test notification",
      },
    });

    res.json({
      success: true,
      messageId: response,
    });
  } catch (error: any) {
  console.error("Firebase Error:", error);

  res.status(500).json({
    success: false,
    message: error.message,
    code: error.code,
  });
}
};