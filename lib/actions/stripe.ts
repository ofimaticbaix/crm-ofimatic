'use server'

import { stripe } from '@/lib/stripe'
import { createClient } from '@/lib/supabase/server'

export async function createCheckoutSession(
  workspaceId: string,
  planId: string,
  billingPeriod: 'monthly' | 'yearly'
) {
  try {
    const supabase = await createClient()

    // Get workspace info
    const { data: workspace, error: wsError } = await supabase
      .from('workspaces')
      .select('id, name, stripe_customer_id')
      .eq('id', workspaceId)
      .single()

    if (wsError || !workspace) {
      return { url: null, error: 'Workspace no encontrado' }
    }

    // Get plan info
    const { data: plan, error: planError } = await supabase
      .from('plans')
      .select('id, name, price_monthly, price_yearly, currency')
      .eq('id', planId)
      .single()

    if (planError || !plan) {
      return { url: null, error: 'Plan no encontrado' }
    }

    // Create or reuse Stripe customer
    let customerId = workspace.stripe_customer_id

    if (!customerId) {
      // Get user email for the customer
      const { data: { user } } = await supabase.auth.getUser()

      const customer = await stripe.customers.create({
        email: user?.email || undefined,
        metadata: {
          workspace_id: workspaceId,
          workspace_name: workspace.name || '',
        },
      })

      customerId = customer.id

      // Save customer ID to workspace
      await supabase
        .from('workspaces')
        .update({ stripe_customer_id: customerId })
        .eq('id', workspaceId)
    }

    // Calculate price in cents
    const unitAmount = billingPeriod === 'monthly'
      ? Math.round(plan.price_monthly * 100)
      : Math.round(plan.price_yearly * 100)

    const interval = billingPeriod === 'monthly' ? 'month' : 'year'

    // Create Checkout Session using price_data (no pre-created Price IDs needed)
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      line_items: [
        {
          price_data: {
            currency: plan.currency || 'eur',
            product_data: {
              name: `CRM AI - Plan ${plan.name}`,
              description: `Suscripcion ${billingPeriod === 'monthly' ? 'mensual' : 'anual'} al plan ${plan.name}`,
            },
            unit_amount: unitAmount,
            recurring: {
              interval: interval as 'month' | 'year',
            },
          },
          quantity: 1,
        },
      ],
      metadata: {
        workspace_id: workspaceId,
        plan_id: planId,
      },
      subscription_data: {
        metadata: {
          workspace_id: workspaceId,
          plan_id: planId,
        },
      },
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/settings?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/settings`,
    })

    return { url: session.url, error: null }
  } catch (err) {
    console.error('Error creating checkout session:', err)
    return { url: null, error: 'Error al crear la sesion de pago' }
  }
}

export async function createBillingPortalSession(workspaceId: string) {
  try {
    const supabase = await createClient()

    const { data: workspace, error } = await supabase
      .from('workspaces')
      .select('stripe_customer_id')
      .eq('id', workspaceId)
      .single()

    if (error || !workspace?.stripe_customer_id) {
      return { url: null, error: 'No se encontro informacion de facturacion' }
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: workspace.stripe_customer_id,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/settings`,
    })

    return { url: session.url, error: null }
  } catch (err) {
    console.error('Error creating billing portal session:', err)
    return { url: null, error: 'Error al abrir el portal de facturacion' }
  }
}
