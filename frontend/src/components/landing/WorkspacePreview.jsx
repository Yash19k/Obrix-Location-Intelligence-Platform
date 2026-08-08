import { useNavigate } from 'react-router-dom'
import { Bookmark, History, FileText, MessageSquareText, ChevronRight, Folder } from 'lucide-react'

const WORKSPACE_ITEMS = [
  {
    icon: Bookmark,
    title: 'Saved Locations',
    count: '12 Sites',
    desc: 'Organize candidate locations across expansion projects.',
    route: '/saved-locations',
  },
  {
    icon: History,
    title: 'Recent Analyses',
    count: '24 Reports',
    desc: 'Review past Site Readiness Scores and factor breakdowns.',
    route: '/dashboard',
  },
  {
    icon: FileText,
    title: 'Generated Reports',
    count: '8 Documents',
    desc: 'Access exportable executive location intelligence reports.',
    route: '/reports',
  },
  {
    icon: MessageSquareText,
    title: 'Ask Obrix Threads',
    count: '16 Chats',
    desc: 'Resume AI location consultant conversations.',
    route: '/ask-obrix',
  },
]

export default function WorkspacePreview() {
  const navigate = useNavigate()

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-[#F6F8FC] bg-gis-grid border-b border-[#DDE3EC]">
      <div className="max-w-7xl mx-auto space-y-12">
        {/* Header */}
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white border border-[#DDE3EC] rounded-full">
            <span className="text-xs font-mono font-semibold tracking-wider text-[#315CF5] uppercase">
              WORKSPACE
            </span>
          </div>

          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#08111F] tracking-tight font-sans">
            Build your location intelligence workspace.
          </h2>

          <p className="text-sm sm:text-base text-[#5D6675] font-sans">
            Keep analyzed sites, reports, and AI discussions organized in a single platform.
          </p>
        </div>

        {/* Workspace Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {WORKSPACE_ITEMS.map((item) => {
            const Icon = item.icon
            return (
              <div
                key={item.title}
                onClick={() => navigate(item.route)}
                className="bg-white border border-[#DDE3EC] rounded-xl p-6 shadow-2xs hover:shadow-md transition-all duration-200 cursor-pointer group hover:-translate-y-0.5 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-10 h-10 rounded-lg bg-[#E9EFFF] text-[#315CF5] flex items-center justify-center group-hover:bg-[#315CF5] group-hover:text-white transition-colors">
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-mono text-[#8A94A3] bg-[#F6F8FC] px-2 py-0.5 rounded border border-[#DDE3EC]">
                      {item.count}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-[#08111F] mb-1 font-sans">
                    {item.title}
                  </h3>

                  <p className="text-xs text-[#5D6675] leading-relaxed font-sans font-normal">
                    {item.desc}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-[#F1F5F9] flex items-center text-xs font-semibold text-[#315CF5] group-hover:translate-x-1 transition-transform">
                  <span>Open workspace</span>
                  <ChevronRight className="w-3.5 h-3.5 ml-1" />
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
