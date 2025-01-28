import { CronJob } from 'cron';
import { NotificationService } from './notification.service';

// Run due date check every day at midnight
const dueDateCheckJob = new CronJob('0 0 * * *', async () => {
  await NotificationService.checkDueDates();
});

dueDateCheckJob.start();