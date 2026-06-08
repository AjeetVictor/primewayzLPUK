import { motion } from 'motion/react';
import { MessageCircle, Users, FileEdit } from 'lucide-react';

export const FloatingContact = () => {
  const actions = [
    {
      icon: Users,
      label: 'Microsoft Teams',
      href: 'https://teams.microsoft.com/l/chat/0/0?users=contact@primewayz.com',
      color: 'bg-[#4B53BC]', // Teams Blue
    },
    {
      icon: MessageCircle,
      label: 'WhatsApp',
      href: 'https://wa.me/91XXXXXXXXXX', // Placeholder for WhatsApp
      color: 'bg-[#25D366]', // WhatsApp Green
    },
    {
      icon: FileEdit,
      label: 'Connect With Us',
      href: '#contact',
      color: 'bg-emerald-600', // App Theme Emerald
    },
  ];

  return (
    <nav 
      className="fixed right-0 top-1/2 -translate-y-1/2 z-50 flex flex-col gap-0 shadow-2xl rounded-l-2xl overflow-hidden"
      aria-label="Floating contact links"
    >
      {actions.map((action, index) => (
        <motion.a
          key={index}
          href={action.href}
          target={action.href.startsWith('http') ? '_blank' : '_self'}
          rel="noopener noreferrer"
          initial={{ x: 50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.5 + index * 0.1 }}
          whileHover={{ x: -10 }}
          className={`${action.color} p-4 text-white hover:brightness-110 transition-all flex items-center justify-center group relative`}
          aria-label={action.label}
        >
          <motion.div
            animate={{ 
              y: [0, -4, 0],
            }}
            transition={{ 
              duration: 3, 
              repeat: Infinity, 
              ease: "easeInOut",
              delay: index * 0.5 // Staggered floating effect
            }}
          >
            <action.icon className="w-6 h-6 group-hover:scale-110 transition-transform" aria-hidden="true" />
          </motion.div>
          
          {/* Subtle pulse ring on hover */}
          <span className="absolute inset-0 bg-white/20 rounded-full scale-0 group-hover:scale-150 opacity-0 group-hover:opacity-0 transition-all duration-700 pointer-events-none" />
          
          {/* Tooltip on hover */}
          <span className="absolute right-full mr-4 px-3 py-1 bg-zinc-900 text-white text-xs font-bold rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none" aria-hidden="true">
            {action.label}
          </span>
        </motion.a>
      ))}
    </nav>
  );
};
