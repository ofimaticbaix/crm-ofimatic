import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createAdminClient } from '@/lib/supabase/admin'
import Stripe from 'stripe'

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')

  if (!signature) {
    return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 })
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const supabase = createAdminClient()

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const workspaceId = session.metadata?.workspace_id
        const planId = session.metadata?.plan_id

        if (!workspaceId || !planId) {
          console.error('Missing metadata in checkout session:', session.id)
          break
        }

        await supabase
          .from('workspaces')
          .update({
            plan_id: planId,
            subscription_status: 'active',
            stripe_customer_id: session.customer as string,
            stripe_subscription_id: session.subscription as string,
          })
          .eq('id', workspaceId)

        console.log(`Workspace ${workspaceId} upgraded to plan ${planId}`)
        break
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        const workspaceId = subscription.metadata?.workspace_id

        if (!workspaceId) {
          console.error('Missing workspace_id in subscription metadata:', subscription.id)
          break
        }

        // Determine the plan based on subscription metadata
        const planId = subscription.metadata?.plan_id

        const updateData: Record<string, string> = {
          subscription_status: subscription.status === 'active' ? 'active' : subscription.status,
        }

        if (planId) {
          updateData.plan_id = planId
        }

        await supabase
          .from('workspaces')
          .update(updateData)
          .eq('id', workspaceId)

        console.log(`Subscription updated for workspace ${workspaceId}: status=${subscription.status}`)
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        const workspaceId = subscription.metadata?.workspace_id

        if (!workspaceId) {
          // Fallback: find workspace by stripe_subscription_id
          const { data: workspace } = await supabase
            .from('workspaces')
            .select('id')
            .eq('stripe_subscription_id', subscription.id)
            .single()

          if (workspace) {
            await supabase
              .from('workspaces')
              .update({
                subscription_status: 'canceled',
                plan_id: 'starter',
              })
              .eq('id', workspace.id)

            console.log(`Subscription canceled for workspace ${workspace.id}, reverted to starter`)
          }
          break
        }

        await supabase
          .from('workspaces')
          .update({
            subscription_status: 'canceled',
            plan_id: 'starter',
          })
          .eq('id', workspaceId)

        console.log(`Subscription canceled for workspace ${workspaceId}, reverted to starter`)
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        const subDetails = invoice.parent?.subscription_details
        const subscriptionId = typeof subDetails?.subscription === 'string'
          ? subDetails.subscription
          : subDetails?.subscription?.id

        if (!subscriptionId) break

        // Find workspace by subscription ID
        const { data: workspace } = await supabase
          .from('workspaces')
          .select('id')
          .eq('stripe_subscription_id', subscriptionId)
          .single()

        if (workspace) {
          await supabase
            .from('workspaces')
            .update({ subscription_status: 'past_due' })
            .eq('id', workspace.id)

          console.log(`Payment failed for workspace ${workspace.id}, marked as past_due`)
        }
        break
      }

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (err) {
    console.error('Error processing webhook event:', err)
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 })
  }
}
