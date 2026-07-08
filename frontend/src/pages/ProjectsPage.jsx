import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { FolderPlus, Folder, ArrowRight, Clock, Plus, LayoutTemplate, MoreVertical, Trash2, Edit3 } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

export default function ProjectsPage() {
  const navigate = useNavigate()
  const [projects, setProjects] = useState([])
  const [showNew, setShowNew] = useState(false)
  const [newProjectName, setNewProjectName] = useState('')

  const { user } = useAuth()

  useEffect(() => {
    fetchProjects()
  }, [])

  const fetchProjects = async () => {
    try {
      const token = localStorage.getItem('lw_token')
      const res = await fetch('http://localhost:8000/projects', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (res.ok) {
        const data = await res.json()
        setProjects(data)
      }
    } catch (e) {
      console.error('Failed to fetch projects', e)
    }
  }

  function handleCreateProject(e) {
    e.preventDefault()
    if (!newProjectName.trim()) return

    // Since /analyze creates the project on the backend automatically, 
    // we can just pass the new name in state or let the analysis page handle the name.
    // Actually, AnalysisRequest doesn't take "name", it takes business_type and location.
    // The project name is generated dynamically. Wait, the original code creates a UUID and navigates to /analyze/:id.
    // Let's keep the frontend routing but understand that the project is saved to backend AFTER analysis.
    
    // We will just navigate to /analyze/new. But wait, AnalysisPage expects an ID.
    // We can generate a UUID and pass it.
    const newId = crypto.randomUUID()
    setNewProjectName('')
    setShowNew(false)
    navigate(`/analyze/${newId}`)
  }

  function handleOpenProject(project) {
    if (project.report) {
      navigate(`/results/${project.id}`)
    } else {
      navigate(`/analyze/${project.id}`)
    }
  }

  function handleDeleteProject(e, id) {
    e.stopPropagation()
    // Not fully implemented on backend, just remove from state for now
    const updated = projects.filter(p => p.id !== id)
    setProjects(updated)
  }

  function handleEditProject(e, id) {
    e.stopPropagation()
    navigate(`/analyze/${id}`)
  }

  return (
    <div className="min-h-screen bg-background text-zinc-100 font-sans relative pt-32 px-6 pb-20">
      <div className="fixed top-0 left-0 w-full h-full bg-glow pointer-events-none z-0" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />

      <div className="max-w-5xl mx-auto relative z-10">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-12 gap-6">
          <div>
            <h1 className="text-4xl font-medium tracking-tight mb-2">My Projects</h1>
            <p className="text-zinc-500 font-light">Manage your startup simulations and analytics.</p>
          </div>
          <button 
            onClick={() => setShowNew(true)}
            className="flex items-center gap-2 px-6 py-3 rounded-full bg-zinc-100 text-black font-medium text-sm hover:scale-[1.02] transition-transform shadow-lg shadow-white/5"
          >
            <Plus size={16} /> New Project
          </button>
        </div>

        {showNew && (
          <motion.form 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-10 p-6 border border-zinc-800 bg-zinc-900/50 backdrop-blur-xl rounded-2xl flex flex-col sm:flex-row gap-4 items-end"
            onSubmit={handleCreateProject}
          >
            <div className="flex-1 w-full">
              <label className="block text-xs font-mono uppercase tracking-widest text-zinc-500 mb-2">Project Name</label>
              <input 
                autoFocus
                type="text"
                value={newProjectName}
                onChange={e => setNewProjectName(e.target.value)}
                placeholder="e.g. Specialty Coffee in Indiranagar"
                className="w-full bg-zinc-950/50 border border-zinc-700/50 focus:border-zinc-500 rounded-xl px-4 py-3 text-zinc-100 placeholder-zinc-600 focus:outline-none transition-colors font-light"
              />
            </div>
            <div className="flex gap-3 w-full sm:w-auto">
              <button 
                type="button" 
                onClick={() => setShowNew(false)}
                className="px-6 py-3 rounded-xl border border-zinc-700 text-zinc-300 hover:bg-zinc-800 transition-colors text-sm font-medium flex-1 sm:flex-none"
              >
                Cancel
              </button>
              <button 
                type="submit"
                disabled={!newProjectName.trim()}
                className="px-6 py-3 rounded-xl bg-blue-500 text-white font-medium hover:bg-blue-600 disabled:opacity-50 transition-colors text-sm flex items-center justify-center gap-2 flex-1 sm:flex-none"
              >
                Start Analysis <ArrowRight size={16} />
              </button>
            </div>
          </motion.form>
        )}

        {projects.length === 0 && !showNew ? (
          <div className="border border-zinc-800 bg-zinc-900/30 rounded-3xl py-20 px-8 text-center flex flex-col items-center">
            <div className="w-16 h-16 rounded-2xl bg-zinc-800/50 flex items-center justify-center mb-6">
              <FolderPlus size={28} className="text-zinc-500" />
            </div>
            <h2 className="text-xl font-medium text-zinc-200 mb-2">No projects yet</h2>
            <p className="text-zinc-500 text-sm max-w-sm mb-8 font-light">Create your first project to run a comprehensive 10-agent analysis on your startup idea.</p>
            <button 
              onClick={() => setShowNew(true)}
              className="px-6 py-3 rounded-full bg-zinc-100 text-black font-medium text-sm hover:scale-[1.02] transition-transform"
            >
              Create First Project
            </button>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((p) => (
              <motion.div 
                whileHover={{ y: -4 }}
                key={p.id}
                onClick={() => handleOpenProject(p)}
                className="cursor-pointer group relative p-6 rounded-2xl border border-zinc-800 bg-zinc-900/40 hover:bg-zinc-800/80 hover:border-zinc-700 transition-all backdrop-blur-md flex flex-col h-48"
              >
                <div className="flex items-start justify-between mb-auto">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                    {p.report ? <LayoutTemplate size={18} className="text-blue-400" /> : <Folder size={18} className="text-zinc-400" />}
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={(e) => handleEditProject(e, p.id)} className="p-2 rounded-lg hover:bg-zinc-700/50 text-zinc-400 hover:text-blue-400 transition-colors">
                      <Edit3 size={16} />
                    </button>
                    <button onClick={(e) => handleDeleteProject(e, p.id)} className="p-2 rounded-lg hover:bg-red-500/20 text-zinc-400 hover:text-red-400 transition-colors">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium tracking-tight text-zinc-100 mb-1 group-hover:text-blue-400 transition-colors line-clamp-1">{p.name}</h3>
                  <div className="flex items-center gap-3 text-xs text-zinc-500 font-mono tracking-wide">
                    <span className="flex items-center gap-1.5"><Clock size={12} /> {new Date(p.createdAt).toLocaleDateString()}</span>
                    <span>•</span>
                    <span className={p.report ? 'text-emerald-400/80' : 'text-amber-400/80'}>
                      {p.report ? 'Analyzed' : 'Draft'}
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
