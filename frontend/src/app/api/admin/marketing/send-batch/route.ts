import { NextResponse } from 'next/server';
import { isAdmin } from '@/lib/adminAuth';
import {
  createMarketingCampaign,
  updateCampaignStatus,
  recordMarketingSendLog,
  getTargetAudienceBatch,
  countTargetAudience,
  renderTemplate,
  buildUnsubscribeUrl,
  sendEmailViaResend,
  TargetFilters,
} from '@/lib/marketing';

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function POST(request: Request) {
  try {
    if (!isAdmin(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();
    let {
      campaign_id,
      campaign_name,
      subject,
      body_html,
      filters = {},
      batch_size = 20,
    } = body;

    // Safety bounds on batch_size
    const size = Math.min(Math.max(parseInt(batch_size, 10) || 20, 1), 100);

    const targetFilters: TargetFilters = {
      prefecture_name: filters.prefecture_name || undefined,
      industry_code: filters.industry_code || undefined,
      min_employees: filters.min_employees ? parseInt(filters.min_employees, 10) : undefined,
      has_website: Boolean(filters.has_website),
      exclude_recent_days: filters.exclude_recent_days !== undefined ? parseInt(filters.exclude_recent_days, 10) : 30,
    };

    // If campaign_id not supplied, create a new campaign
    if (!campaign_id) {
      const totalCount = await countTargetAudience(targetFilters);
      if (totalCount === 0) {
        return NextResponse.json({ error: 'No recipients match the specified filters' }, { status: 400 });
      }

      const newCampaign = await createMarketingCampaign({
        name: campaign_name || `Campaign - ${new Date().toLocaleDateString('ja-JP')}`,
        subject: subject,
        body_html: body_html,
        target_filters: targetFilters,
        total_targeted: totalCount,
      });
      campaign_id = newCampaign.id;
    }

    // Fetch next batch of targets
    const batch = await getTargetAudienceBatch(targetFilters, size, 0);

    if (batch.length === 0) {
      await updateCampaignStatus(campaign_id, 'completed');
      return NextResponse.json({
        success: true,
        campaign_id,
        is_finished: true,
        sent_in_batch: 0,
        failed_in_batch: 0,
        logs: [],
        remaining: 0,
      });
    }

    const logs: any[] = [];
    let sentCount = 0;
    let failedCount = 0;

    for (let i = 0; i < batch.length; i++) {
      const recipient = batch[i];
      const unsubscribeUrl = buildUnsubscribeUrl(recipient.email_address);
      const personalizedSubject = renderTemplate(subject, recipient, unsubscribeUrl);
      const personalizedHtml = renderTemplate(body_html, recipient, unsubscribeUrl);

      const result = await sendEmailViaResend({
        to: recipient.email_address,
        subject: personalizedSubject,
        html: personalizedHtml,
      });

      if (result.success) {
        sentCount++;
        await recordMarketingSendLog({
          campaign_id,
          corporate_number: recipient.corporate_number,
          company_name: recipient.company_name,
          recipient_email: recipient.email_address,
          status: 'sent',
        });
        logs.push({
          corporate_number: recipient.corporate_number,
          company_name: recipient.company_name,
          email: recipient.email_address,
          status: 'sent',
        });
      } else {
        failedCount++;
        await recordMarketingSendLog({
          campaign_id,
          corporate_number: recipient.corporate_number,
          company_name: recipient.company_name,
          recipient_email: recipient.email_address,
          status: 'failed',
          error_message: result.error,
        });
        logs.push({
          corporate_number: recipient.corporate_number,
          company_name: recipient.company_name,
          email: recipient.email_address,
          status: 'failed',
          error: result.error,
        });
      }

      // Safe rate-limit delay (600ms between calls)
      if (i < batch.length - 1) {
        await sleep(600);
      }
    }

    // Check remaining
    const remaining = await countTargetAudience(targetFilters);
    if (remaining === 0) {
      await updateCampaignStatus(campaign_id, 'completed');
    }

    return NextResponse.json({
      success: true,
      campaign_id,
      is_finished: remaining === 0,
      sent_in_batch: sentCount,
      failed_in_batch: failedCount,
      remaining,
      logs,
    });
  } catch (error: any) {
    console.error('Error in /api/admin/marketing/send-batch POST:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
