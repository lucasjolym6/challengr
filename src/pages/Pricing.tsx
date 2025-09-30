import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, Zap } from 'lucide-react';
import { useAuth } from '@/components/auth/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const plans = [
  {
    id: 'monthly',
    name: 'Monthly Premium',
    price: '$9.99',
    interval: 'month',
    priceId: 'price_monthly', // Replace with actual Stripe price ID
    features: [
      'Full access to all tutorials & coaching',
      'Premium badges & achievements',
      'Access to premium challenges',
      'Ad-free experience',
      'Priority support',
      'Early access to new features'
    ]
  },
  {
    id: 'yearly',
    name: 'Yearly Premium',
    price: '$99.99',
    interval: 'year',
    priceId: 'price_yearly', // Replace with actual Stripe price ID
    popular: true,
    features: [
      'All Monthly Premium features',
      'Save 17% compared to monthly',
      'Exclusive yearly member perks',
      'Advanced analytics dashboard',
      'Custom challenge creation',
      'Private coaching sessions'
    ]
  }
];

const Pricing = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState<string | null>(null);

  const handleSubscribe = async (priceId: string, planId: string) => {
    if (!user) {
      toast({
        title: 'Authentication Required',
        description: 'Please sign in to upgrade to premium.',
        variant: 'destructive'
      });
      navigate('/auth');
      return;
    }

    setLoading(planId);
    try {
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { priceId }
      });

      if (error) throw error;

      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error('Checkout error:', error);
      toast({
        title: 'Error',
        description: 'Failed to start checkout process. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="container mx-auto px-4 py-12 max-w-6xl">
      <div className="text-center mb-12">
        <Badge className="mb-4">Premium Plans</Badge>
        <h1 className="text-4xl font-bold mb-4">Upgrade to Premium</h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Unlock the full potential of your journey with premium access to all tutorials, coaching content, and exclusive features.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
        {plans.map((plan) => (
          <Card 
            key={plan.id} 
            className={`relative ${plan.popular ? 'border-primary shadow-lg' : ''}`}
          >
            {plan.popular && (
              <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                <Badge className="bg-primary text-primary-foreground">
                  <Zap className="w-3 h-3 mr-1" />
                  Most Popular
                </Badge>
              </div>
            )}
            
            <CardHeader>
              <CardTitle className="text-2xl">{plan.name}</CardTitle>
              <CardDescription>
                <span className="text-3xl font-bold text-foreground">{plan.price}</span>
                <span className="text-muted-foreground">/{plan.interval}</span>
              </CardDescription>
            </CardHeader>

            <CardContent>
              <ul className="space-y-3">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>

            <CardFooter>
              <Button
                className="w-full"
                size="lg"
                onClick={() => handleSubscribe(plan.priceId, plan.id)}
                disabled={loading !== null}
                variant={plan.popular ? 'default' : 'outline'}
              >
                {loading === plan.id ? 'Processing...' : 'Subscribe Now'}
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      <div className="text-center mt-8">
        <Button variant="ghost" onClick={() => navigate(-1)}>
          Go Back
        </Button>
      </div>
    </div>
  );
};

export default Pricing;
