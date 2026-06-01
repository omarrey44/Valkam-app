import * as Notifications from 'expo-notifications';

export async function scheduleTaskReminder(tareaId: string, titulo: string, fechaVencimiento: string) {
  const date = new Date(fechaVencimiento + 'T09:00:00');
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);

  if (date < tomorrow) return;

  // Notificación el día anterior a las 9am
  const notifDate = new Date(date);
  notifDate.setDate(notifDate.getDate() - 1);
  notifDate.setHours(9, 0, 0, 0);

  if (notifDate <= new Date()) return;

  await Notifications.cancelScheduledNotificationAsync(tareaId).catch(() => {});

  await Notifications.scheduleNotificationAsync({
    identifier: tareaId,
    content: {
      title: 'Tarea vence mañana',
      body: titulo,
      data: { tareaId },
    },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: notifDate },
  });
}

export async function cancelTaskReminder(tareaId: string) {
  await Notifications.cancelScheduledNotificationAsync(tareaId).catch(() => {});
}
