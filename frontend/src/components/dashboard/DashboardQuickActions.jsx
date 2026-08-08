import { useNavigate } from 'react-router-dom'
import { MapPin, GitCompare, Sparkles, FileText, ArrowRight } from 'lucide-react'

const ACTIONS = [
  {
    title: 'Analyze Location',
    desc: 'Select coordinates and evaluate site readiness score',
    icon: MapPin,
    route: '/analyze',
    color: 'text-[#315CF5]',
    bg: 'bg-[#E9EFFF]',
  },
  {
    title: 'Compare Sites (A vs B)',
    desc: 'Evaluate two candidate locations head-to-head',
    icon: GitCompare,
    route: '/analyze',
    color: 'text-[#315CF5]',
    bg: 'bg-[#E9EFFF]',
  },
  {
    title: 'Ask Obrix Assistant',
    desc: 'Consult your AI location intelligence assistant',
    icon: Sparkles,
    route: '/ask-obrix',
    color: 'text-[#315CF5]',
    bg: 'bg-[#E9EFFF]',
  },
  {
    title: 'View Reports',
    desc: 'Access 13-section consulting deliverables and PDF exports',
    icon: FileText,
    route: '/reports',
    color: 'text-[#08111F]',
    bg: 'bg-[#F6F8FC]',
  },
]

export default function DashboardQuickActions() {
  const navigate = useNavigate()

  return (
    <div className="space-y-3 font-sans">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-extrabold text-[#08111F]">Quick Platform Actions</h3>
        <span className="text-xs font-mono text-[#8A94A3]">DIRECT NAVIGATION</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {ACTIONS.map((act) => {
          const Icon = act.icon
          return (
            <div
              key={act.title}
              onClick={() => navigate(act.route)}
              className="bg-white border border-[#DDE3EC] rounded-2xl p-4 shadow-2xs hover:shadow-md transition-all duration-200 cursor-pointer group hover:-translate-y-0.5 flex flex-col justify-between"
            >
              <div className="flex items-start justify-between mb-3">
                <div className={`w-10 h-10 rounded-xl ${act.bg} ${act.color} flex items-center justify-center group-hover:scale-105 transition-transform`}>
                  <Icon className="w-5 h-5" />
                </div>
                <ArrowRight className="w-4 h-4 text-[#8A94A3] group-hover:text-[#315CF5] group-hover:translate-x-0.5 transition-all" />
              </div>

              <div>
                <h4 className="text-sm font-bold text-[#08111F] mb-1 font-sans">{act.title}</h4>
                <p className="text-xs text-[#5D6675] leading-relaxed font-sans font-normal">{act.desc}</p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
