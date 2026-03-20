import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Book, 
  Code, 
  Terminal, 
  Globe, 
  ShieldCheck, 
  ChevronRight, 
  Copy, 
  Check,
  Zap,
  Cpu,
  ArrowRight
} from 'lucide-react';
import { cn } from '../utils';

const CODE_EXAMPLES = {
  curl: `curl -X GET "https://veloxpro.io/api/v1/balance?api_key=sk_live_your_key"`,
  javascript: `fetch('https://veloxpro.io/api/v1/services', {
  headers: {
    'x-api-key': 'sk_live_your_key'
  }
})
.then(res => res.json())
.then(data => console.log(data));`,
  python: `import requests

url = "https://veloxpro.io/api/v1/order"
payload = {
    "service_id": "123",
    "quantity": 1000,
    "api_key": "sk_live_your_key"
}

response = requests.post(url, json=payload)
print(response.json())`
};

export const APIDocumentation: React.FC = () => {
  const [activeLang, setActiveLang] = useState<'curl' | 'javascript' | 'python'>('curl');
  const [copied, setCopied] = useState(false);

  const copyCode = () => {
    navigator.clipboard.writeText(CODE_EXAMPLES[activeLang]);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="pt-32 pb-20 px-6 max-w-7xl mx-auto">
      <div className="flex flex-col lg:flex-row gap-16">
        {/* Navigation Sidebar */}
        <aside className="w-full lg:w-64 shrink-0 space-y-8">
          <div className="sticky top-32">
            <h2 className="text-xs font-bold text-[#6B7280] dark:text-slate-500 uppercase tracking-widest mb-4">Documentation</h2>
            <nav className="space-y-1">
              {[
                { label: 'Introduction', icon: Book, active: true },
                { label: 'Authentication', icon: ShieldCheck },
                { label: 'Endpoints', icon: Globe },
                { label: 'Error Codes', icon: Code },
              ].map((item, i) => (
                <button
                  key={i}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all text-left",
                    item.active 
                      ? "bg-primary text-white shadow-lg shadow-primary/20" 
                      : "hover:bg-slate-100 dark:hover:bg-slate-800 text-[#6B7280] dark:text-slate-400"
                  )}
                >
                  <item.icon size={18} />
                  {item.label}
                </button>
              ))}
            </nav>
          </div>
        </aside>

        {/* Content */}
        <main className="flex-grow space-y-16">
          {/* Header */}
          <section>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-wider mb-6">
              <Cpu size={12} />
              Developer API V1.0
            </div>
            <h1 className="text-5xl font-bold font-display text-[#1F2937] dark:text-white mb-6">VeloxPro API</h1>
            <p className="text-xl text-[#6B7280] dark:text-slate-400 max-w-3xl leading-relaxed">
              Integrate VeloxPro's global social media and digital growth services directly into your own platform. 
              Our developer API is designed to be simple, fast, and secure.
            </p>
          </section>

          {/* Authentication */}
          <section className="space-y-6">
            <h3 className="text-3xl font-bold font-display text-[#1F2937] dark:text-white">Authentication</h3>
            <p className="text-[#6B7280] dark:text-slate-400">
              All API requests require your unique API key. You can authenticate either via query parameters or custom headers.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="glass p-6 rounded-3xl border border-slate-100 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50">
                <p className="text-xs font-bold text-primary uppercase tracking-wider mb-2">Query Param</p>
                <code className="text-sm font-mono text-[#1F2937] dark:text-slate-200">?api_key=sk_live_...</code>
              </div>
              <div className="glass p-6 rounded-3xl border border-slate-100 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50">
                <p className="text-xs font-bold text-primary uppercase tracking-wider mb-2">Header</p>
                <code className="text-sm font-mono text-[#1F2937] dark:text-slate-200">x-api-key: sk_live_...</code>
              </div>
            </div>
          </section>

          {/* Interactive Code Section */}
          <section className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-2xl font-bold font-display text-[#1F2937] dark:text-white flex items-center gap-2">
                <Terminal size={24} className="text-primary" />
                Quick Examples
              </h3>
              <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                {['curl', 'javascript', 'python'].map((lang) => (
                  <button
                    key={lang}
                    onClick={() => setActiveLang(lang as any)}
                    className={cn(
                      "px-4 py-1.5 rounded-lg text-xs font-bold capitalize transition-all",
                      activeLang === lang 
                        ? "bg-white dark:bg-slate-700 text-[#1F2937] dark:text-white shadow-sm" 
                        : "text-[#6B7280] dark:text-slate-500 hover:text-primary"
                    )}
                  >
                    {lang}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="relative group">
              <pre className="glass p-8 rounded-[2rem] bg-slate-900 dark:bg-black border border-slate-800 text-sm font-mono text-slate-300 overflow-x-auto min-h-[160px]">
                <code>{CODE_EXAMPLES[activeLang]}</code>
              </pre>
              <button 
                onClick={copyCode}
                className="absolute top-6 right-6 p-3 bg-white/10 hover:bg-white/20 rounded-xl transition-all text-white border border-white/10"
              >
                {copied ? <Check size={18} className="text-emerald-500" /> : <Copy size={18} />}
              </button>
            </div>
          </section>

          {/* Endpoint Details */}
          <section className="space-y-8">
            <h3 className="text-3xl font-bold font-display text-[#1F2937] dark:text-white">API Endpoints</h3>
            
            <div className="space-y-6">
              {[
                { method: 'GET', path: '/api/v1/balance', desc: 'Get your current wallet balance.', params: ['api_key'] },
                { method: 'GET', path: '/api/v1/services', desc: 'List all available services with IDs and pricing.', params: ['api_key'] },
                { method: 'POST', path: '/api/v1/order', desc: 'Create a new automated service order.', params: ['service_id', 'quantity', 'api_key'] },
                { method: 'GET', path: '/api/v1/status', desc: 'Check the current delivery status of an order.', params: ['order_id', 'api_key'] }
              ].map((endpoint, i) => (
                <div key={i} className="glass p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 group hover:border-primary/30 transition-all duration-500">
                  <div className="flex items-center gap-4 mb-4">
                    <span className={cn(
                      "px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border",
                      endpoint.method === 'GET' ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" : "bg-primary/10 text-primary border-primary/20"
                    )}>
                      {endpoint.method}
                    </span>
                    <span className="font-mono text-sm font-bold text-[#1F2937] dark:text-white">{endpoint.path}</span>
                  </div>
                  <p className="text-[#6B7280] dark:text-slate-400 mb-6">{endpoint.desc}</p>
                  
                  <div className="flex items-center gap-4 flex-wrap">
                    <span className="text-[10px] font-bold text-[#6B7280] uppercase tracking-widest">Required Params:</span>
                    {endpoint.params.map((p, k) => (
                      <span key={k} className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[10px] font-mono text-[#1F2937] dark:text-slate-300">
                        {p}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* CTA */}
          <section className="glass p-12 rounded-[3.5rem] bg-gradient-to-br from-primary to-blue-600 text-white relative overflow-hidden">
            <div className="relative z-10">
              <h3 className="text-3xl font-bold mb-4">Ready to boost your growth?</h3>
              <p className="text-white/80 mb-8 max-w-xl">Join thousands of developers and resellers who trust VeloxPro for their social media integration needs.</p>
              <div className="flex gap-4">
                <button className="bg-white text-primary px-8 py-4 rounded-2xl font-bold hover:scale-105 transition-all shadow-xl shadow-black/20 flex items-center gap-2">
                  Get Started Now 
                  <ArrowRight size={18} />
                </button>
                <button className="bg-white/10 border border-white/20 text-white px-8 py-4 rounded-2xl font-bold hover:bg-white/20 transition-all">
                  Contact Sales
                </button>
              </div>
            </div>
            <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 bg-white/10 rounded-full blur-3xl" />
          </section>
        </main>
      </div>
    </div>
  );
};
