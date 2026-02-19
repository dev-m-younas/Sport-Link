import { ACTIVITIES } from "@/constants/activities";
import Constants from "expo-constants";
import { doc, updateDoc } from "firebase/firestore";
import { Platform } from "react-native";
import { db } from "./firebase";
import type { ScheduledActivityDoc } from "./scheduledActivities";

const SCHEDULED_ACTIVITIES_COLLECTION = "scheduledActivities";

/** Lazy-load expo-notifications to avoid crash in Expo Go (not supported there) */
let _notifications: typeof import("expo-notifications") | null | undefined =
  undefined;

async function getNotifications(): Promise<
  typeof import("expo-notifications") | null
> {
  if (_notifications !== undefined) return _notifications;
  // Never load expo-notifications in Expo Go - it throws
  if (Constants.appOwnership === "expo") {
    _notifications = null;
    return null;
  }
  try {
    _notifications = await import("expo-notifications");
    return _notifications;
  } catch {
    _notifications = null;
    return null;
  }
}

function getActivityName(activityId: string): string {
  return ACTIVITIES.find((a) => a.id === activityId)?.name ?? activityId;
}

/**
 * Request notification permissions
 */
export async function requestNotificationPermissions(): Promise<boolean> {
  const Notifications = await getNotifications();
  if (!Notifications) return false;
  try {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
      }),
    });
    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== "granted") {
      console.warn("Notification permissions not granted");
      return false;
    }

    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("activity-reminders", {
        name: "Activity Reminders",
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#00ADB5",
      });
      await Notifications.setNotificationChannelAsync("chat", {
        name: "Chat Messages",
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#00ADB5",
      });
      await Notifications.setNotificationChannelAsync("join-request", {
        name: "Join Activity Requests",
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#00ADB5",
      });
    }

    return true;
  } catch (error) {
    console.error("Error requesting notification permissions:", error);
    return false;
  }
}

/**
 * Schedule a notification for 1 hour before activity
 */
export async function scheduleActivityNotification(
  scheduledActivity: ScheduledActivityDoc,
): Promise<string | null> {
  const Notifications = await getNotifications();
  if (!Notifications) return null;
  try {
    const hasPermission = await requestNotificationPermissions();
    if (!hasPermission) return null;

    const activityDateTime = new Date(
      `${scheduledActivity.activityDate}T${scheduledActivity.activityTime}`,
    );
    const oneHourBefore = new Date(activityDateTime.getTime() - 60 * 60 * 1000);
    const now = new Date();

    if (oneHourBefore <= now) return null;

    const activityName = getActivityName(scheduledActivity.activityName);

    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: "Activity Reminder",
        body: `Your ${activityName} activity with ${scheduledActivity.partnerName} starts in 1 hour!`,
        data: {
          scheduledActivityId: scheduledActivity.id,
          activityId: scheduledActivity.activityId,
        },
        sound: true,
      },
      trigger: {
        date: oneHourBefore,
      },
    });

    const scheduledActivityRef = doc(
      db,
      SCHEDULED_ACTIVITIES_COLLECTION,
      scheduledActivity.id,
    );
    await updateDoc(scheduledActivityRef, {
      notificationSent: false,
      notificationId: notificationId,
    });

    return notificationId;
  } catch (error) {
    console.error("Error scheduling notification:", error);
    return null;
  }
}

/**
 * Cancel a scheduled notification
 */
export async function cancelActivityNotification(
  notificationId: string,
): Promise<void> {
  const Notifications = await getNotifications();
  if (!Notifications) return;
  try {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
  } catch (error) {
    console.error("Error canceling notification:", error);
  }
}

/**
 * Schedule notifications for all upcoming activities
 */
export async function scheduleAllUpcomingNotifications(
  scheduledActivities: ScheduledActivityDoc[],
): Promise<void> {
  const Notifications = await getNotifications();
  if (!Notifications) return;
  try {
    const now = new Date();
    for (const activity of scheduledActivities) {
      const activityDateTime = new Date(
        `${activity.activityDate}T${activity.activityTime}`,
      );
      const oneHourBefore = new Date(
        activityDateTime.getTime() - 60 * 60 * 1000,
      );
      if (
        activityDateTime > now &&
        oneHourBefore > now &&
        !activity.notificationSent
      ) {
        await scheduleActivityNotification(activity);
      }
    }
  } catch (error) {
    console.error("Error scheduling all notifications:", error);
  }
}

/**
 * Check and send notifications for activities that need them (current user only)
 */
export async function checkAndSendNotifications(userId: string): Promise<void> {
  const Notifications = await getNotifications();
  if (!Notifications || !userId) return;
  try {
    const { getActivitiesNeedingNotification } =
      await import("./scheduledActivities");
    const activities = await getActivitiesNeedingNotification(userId);

    for (const activity of activities) {
      const activityDateTime = new Date(
        `${activity.activityDate}T${activity.activityTime}`,
      );
      const oneHourBefore = new Date(
        activityDateTime.getTime() - 60 * 60 * 1000,
      );
      const now = new Date();

      if (
        now >= oneHourBefore &&
        now < activityDateTime &&
        !activity.notificationSent
      ) {
        const activityName = getActivityName(activity.activityName);

        await Notifications.scheduleNotificationAsync({
          content: {
            title: "Activity Reminder",
            body: `Your ${activityName} activity with ${activity.partnerName} starts in 1 hour!`,
            data: {
              scheduledActivityId: activity.id,
              activityId: activity.activityId,
            },
            sound: true,
          },
          trigger: null,
        });

        const scheduledActivityRef = doc(
          db,
          SCHEDULED_ACTIVITIES_COLLECTION,
          activity.id,
        );
        await updateDoc(scheduledActivityRef, {
          notificationSent: true,
        });
      }
    }
  } catch (error) {
    console.error("Error checking and sending notifications:", error);
  }
}
