import React from 'react';
import { AlertCircle, Copy, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

const SupabaseConfigError: React.FC = () => {
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#FFF7F2] via-white to-[#FFF2EC] flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
            <AlertCircle className="w-6 h-6 text-red-600" />
          </div>
          <CardTitle className="text-2xl text-red-600">Configuration Supabase manquante</CardTitle>
          <CardDescription className="text-lg">
            L'application ne peut pas se connecter à la base de données
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Les variables d'environnement Supabase ne sont pas configurées.
            </AlertDescription>
          </Alert>

          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Étapes pour résoudre :</h3>
            
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <span className="bg-blue-100 text-blue-800 text-sm font-medium px-2.5 py-0.5 rounded">1</span>
                <div className="flex-1">
                  <p className="font-medium">Créer le fichier <code className="bg-gray-100 px-1 rounded">.env.local</code></p>
                  <p className="text-sm text-muted-foreground">À la racine du projet</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <span className="bg-blue-100 text-blue-800 text-sm font-medium px-2.5 py-0.5 rounded">2</span>
                <div className="flex-1">
                  <p className="font-medium">Aller sur le Dashboard Supabase</p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="mt-1"
                    onClick={() => window.open('https://supabase.com/dashboard', '_blank')}
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Ouvrir Supabase
                  </Button>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <span className="bg-blue-100 text-blue-800 text-sm font-medium px-2.5 py-0.5 rounded">3</span>
                <div className="flex-1">
                  <p className="font-medium">Copier les clés API</p>
                  <p className="text-sm text-muted-foreground">Settings → API → Project URL & anon key</p>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="font-semibold">Contenu du fichier <code>.env.local</code> :</h4>
            <div className="bg-gray-900 text-gray-100 p-4 rounded-lg font-mono text-sm relative">
              <Button
                variant="ghost"
                size="sm"
                className="absolute top-2 right-2 text-gray-400 hover:text-white"
                onClick={() => copyToClipboard(`VITE_SUPABASE_URL=https://ton-projet.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`)}
              >
                <Copy className="w-4 h-4" />
              </Button>
              <div className="space-y-1">
                <div><span className="text-green-400">VITE_SUPABASE_URL</span>=<span className="text-yellow-400">https://ton-projet.supabase.co</span></div>
                <div><span className="text-green-400">VITE_SUPABASE_PUBLISHABLE_KEY</span>=<span className="text-yellow-400">eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...</span></div>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="font-semibold">Après avoir créé le fichier :</h4>
            <div className="bg-gray-100 p-3 rounded-lg font-mono text-sm">
              npm run dev
            </div>
          </div>

          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Important :</strong> Le fichier <code>.env.local</code> ne doit jamais être commité dans Git.
              Il contient des informations sensibles.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
};

export default SupabaseConfigError;
