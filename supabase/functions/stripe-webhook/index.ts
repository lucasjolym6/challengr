import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import Stripe from 'https://esm.sh/stripe@14.21.0'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2023-10-16',
})

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

serve(async (req) => {
  const signature = req.headers.get('stripe-signature')
  const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')

  if (!signature || !webhookSecret) {
    return new Response('Missing signature or webhook secret', { status: 400 })
  }

  try {
    const body = await req.text()
    const event = stripe.webhooks.constructEvent(body, signature, webhookSecret)

    console.log('Webhook event:', event.type)

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const userId = session.metadata?.user_id

        if (userId) {
          // Update user to premium
          const { error } = await supabase
            .from('profiles')
            .update({ is_premium: true })
            .eq('user_id', userId)

          if (error) {
            console.error('Error updating user premium status:', error)
            throw error
          }

          console.log('User upgraded to premium:', userId)
        }
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        const session = await stripe.checkout.sessions.list({
          subscription: subscription.id,
          limit: 1,
        })

        if (session.data.length > 0) {
          const userId = session.data[0].metadata?.user_id

          if (userId) {
            // Remove premium status
            const { error } = await supabase
              .from('profiles')
              .update({ is_premium: false })
              .eq('user_id', userId)

            if (error) {
              console.error('Error removing user premium status:', error)
              throw error
            }

            console.log('User premium status removed:', userId)
          }
        }
        break
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        const isActive = subscription.status === 'active'
        
        const session = await stripe.checkout.sessions.list({
          subscription: subscription.id,
          limit: 1,
        })

        if (session.data.length > 0) {
          const userId = session.data[0].metadata?.user_id

          if (userId) {
            const { error } = await supabase
              .from('profiles')
              .update({ is_premium: isActive })
              .eq('user_id', userId)

            if (error) {
              console.error('Error updating user premium status:', error)
              throw error
            }

            console.log('User premium status updated:', userId, isActive)
          }
        }
        break
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    console.error('Webhook error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})
