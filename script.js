const { useState, useEffect, useMemo, useRef } = React;

// --- CONSTANTS: LOML EDITION ---
const GOALS = { 
    calories: 2450, 
    carbs: 305, 
    protein: 125, 
    fat: 80, 
    fiber: 30 
};

// PRELOADED LIBRARY
const STARTER_LIBRARY = [
    { id: '1', name: 'Egg Whites', carbs: 0, protein: 11.7, fat: 0, fiber: 0, measure: 'g' },
    { id: '2', name: 'Greek Yogurt', carbs: 4.1, protein: 10.6, fat: 0, fiber: 0, measure: 'g' },
    { id: '3', name: 'Banana', carbs: 22, protein: 1, fat: 0, fiber: 2.5, measure: 'unit' },
    { id: '4', name: 'Salmon', carbs: 0, protein: 23.3, fat: 12, fiber: 0, measure: 'g' },
    { id: '5', name: 'Garbanzo Beans', carbs: 16.9, protein: 5.4, fat: 1.5, fiber: 4.6, measure: 'g' },
    { id: '6', name: 'Avocado', carbs: 8, protein: 2, fat: 14, fiber: 6, measure: 'g' },
    { id: '7', name: 'Quinoa', carbs: 26, protein: 5, fat: 2, fiber: 2, measure: 'g' },
    { id: '8', name: 'Chicken Breast', carbs: 0, protein: 31, fat: 3, fiber: 0, measure: 'g' }
];

const MOTIVATION_QUOTES = [
    "Stay Paws-itive! 🐾",
    "Purr-fect session! ✨",
    "You're doing clawsome! 😻",
    "Feline strong today! 💪",
    "Meow-velous progress! ⭐"
];

// --- HELPERS ---
const getLocalYMD = () => {
    const now = new Date();
    const local = new Date(now.getTime() - (now.getTimezoneOffset() * 60000));
    return local.toISOString().split('T')[0];
};

const calcCals = (c, p, f) => Math.round((c * 4) + (p * 4) + (f * 9));

// --- COMPONENTS ---
const CatGif = ({ className }) => {
    const gifUrl = "https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Animals/Cat%20Face.png";
    return <img src={gifUrl} alt="Mochi Cat" className={`object-contain ${className}`} />;
};

const ProgressBar = ({ current, max, colorClass, label }) => {
    const pct = Math.min(100, (current / max) * 100);
    return (
        <div className="flex flex-col w-full mb-3">
            <div className="flex justify-between text-[10px] font-black mb-1 text-slate-400 uppercase tracking-wide">
                <span>{label}</span>
                <span className={current > max ? 'text-red-400' : 'text-slate-500'}>{Math.round(current)}g / {max}g</span>
            </div>
            <div className="h-4 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-50">
                <div className={`h-full transition-all duration-1000 ${colorClass}`} style={{ width: `${pct}%`, borderRadius: '999px' }}></div>
            </div>
        </div>
    );
};

// --- MAIN APP ---
function App() {
    const [view, setView] = useState('home');
    const [data, setData] = useState({ history: {}, fitnessHistory: {}, library: STARTER_LIBRARY });
    const [date, setDate] = useState(getLocalYMD());
    
    // UI State
    const [welcomeModal, setWelcomeModal] = useState(false);
    const [modalOpen, setModalOpen] = useState(false);
    const [workoutModalOpen, setWorkoutModalOpen] = useState(false);
    const [finishModalOpen, setFinishModalOpen] = useState(false);
    const [successModalData, setSuccessModalData] = useState(null); 
    const [swatTrigger, setSwatTrigger] = useState(false);

    // Entry State
    const [editFood, setEditFood] = useState({ name: '', weight: 100, carbs: 0, protein: 0, fat: 0, fiber: 0, measure: 'g' });
    const [selectedBaseItem, setSelectedBaseItem] = useState(null);
    const [activeWorkout, setActiveWorkout] = useState([]);
    const [newEx, setNewEx] = useState({ name: '', sets: 1, reps: 10, weight: 0, difficulty: '😏' });
    const [workoutDuration, setWorkoutDuration] = useState(30);
    const [librarySearch, setLibrarySearch] = useState('');

    // Persistence & First-Time Welcome
    useEffect(() => {
        try {
            const saved = localStorage.getItem('meow_loml_v1');
            const welcomeSeen = localStorage.getItem('loml_welcome_seen');
            
            if (saved) setData(JSON.parse(saved));
            
            // Welcome Modal Logic
            if (!welcomeSeen) {
                setWelcomeModal(true);
                localStorage.setItem('loml_welcome_seen', 'true');
            }
        } catch (e) {
            console.error("Initialization Error:", e);
        }
    }, []);

    useEffect(() => {
        localStorage.setItem('meow_loml_v1', JSON.stringify(data));
    }, [data]);

    // Derived Logic
    const todayLog = data.history[date] || [];
    const todayWorkouts = data.fitnessHistory[date] || [];
    const totals = todayLog.reduce((acc, item) => ({
        c: acc.c + item.c, p: acc.p + item.p, f: acc.f + item.f, fib: acc.fib + item.fib
    }), { c: 0, p: 0, f: 0, fib: 0 });
    
    const totalEatenCals = calcCals(totals.c, totals.p, totals.f);
    const totalBurnedCals = todayWorkouts.reduce((acc, w) => acc + w.calories, 0);
    const adjustedGoal = GOALS.calories + totalBurnedCals;
    const remainingCals = adjustedGoal - totalEatenCals;

    const handleWeightChange = (val) => {
        const newWeight = Number(val);
        if (selectedBaseItem) {
            const baseAmount = selectedBaseItem.measure === 'unit' ? 1 : 100;
            const ratio = newWeight / baseAmount;
            setEditFood({
                ...editFood, weight: newWeight,
                carbs: parseFloat((selectedBaseItem.carbs * ratio).toFixed(1)),
                protein: parseFloat((selectedBaseItem.protein * ratio).toFixed(1)),
                fat: parseFloat((selectedBaseItem.fat * ratio).toFixed(1)),
                fiber: parseFloat((selectedBaseItem.fiber * ratio).toFixed(1))
            });
        } else setEditFood({ ...editFood, weight: newWeight });
    };

    const handleAddFood = () => {
        const newEntry = {
            id: Date.now(), name: editFood.name, weight: editFood.weight, measure: editFood.measure,
            c: editFood.carbs, p: editFood.protein, f: editFood.fat, fib: editFood.fiber
        };
        setData({ 
            ...data, 
            history: { ...data.history, [date]: [newEntry, ...(data.history[date] || [])] }
        });
        setModalOpen(false);
        setSwatTrigger(true);
        setTimeout(() => setSwatTrigger(false), 1200);
    };

    const openAddFood = (item = null) => {
        if (item) {
            const startWeight = item.measure === 'unit' ? 1 : 100;
            setEditFood({ ...item, weight: startWeight });
            setSelectedBaseItem(item);
        } else {
            setEditFood({ name: '', weight: 100, carbs: 0, protein: 0, fat: 0, fiber: 0, measure: 'g' });
            setSelectedBaseItem(null);
        }
        setModalOpen(true);
    };

    const handleAddExercise = () => {
        if (!newEx.name) return;
        setActiveWorkout([...activeWorkout, { ...newEx, id: Date.now() }]);
        setNewEx({ name: '', sets: 1, reps: 10, weight: 0, difficulty: '😏' });
        setWorkoutModalOpen(false);
    };

    const handleFinishWorkout = () => {
        const burned = Math.round(workoutDuration * 6);
        const log = { 
            id: Date.now(), 
            duration: workoutDuration, 
            calories: burned, 
            exercises: activeWorkout,
            quote: MOTIVATION_QUOTES[Math.floor(Math.random() * MOTIVATION_QUOTES.length)]
        };
        setData({ 
            ...data, 
            fitnessHistory: { ...data.fitnessHistory, [date]: [log, ...(data.fitnessHistory[date] || [])] } 
        });
        setSuccessModalData({
            title: "Nice Work, LOML!",
            message: log.quote,
            subtext: `Burned: ${burned} kcal`
        });
        setActiveWorkout([]);
        setFinishModalOpen(false);
    };

    return (
        <div className="max-w-md mx-auto min-h-screen px-4 py-6 relative font-nunito">
            
            {/* WELCOME MODAL */}
            {welcomeModal && (
                <div className="fixed inset-0 z-[110] bg-blue-100/90 backdrop-blur-md flex items-center justify-center p-8 animate-pop">
                    <div className="bg-white p-10 rounded-[3rem] shadow-2xl text-center border-4 border-blue-50">
                        <CatGif className="w-32 h-32 mx-auto mb-6" />
                        <h2 className="text-2xl font-black text-blue-400 mb-4">Hello my love</h2>
                        <p className="text-slate-500 font-bold mb-8 italic">"Good luck on your journey. Your loving husband, Marco."</p>
                        <button onClick={() => setWelcomeModal(false)} className="btn-mint w-full py-4 text-lg uppercase tracking-widest">Let's go!</button>
                    </div>
                </div>
            )}

            {/* VIEWS */}
            {view === 'home' && (
                <div className="space-y-6 pb-20 safe-pb px-2">
                    <header className="flex justify-between items-center mb-2">
                        <div className="flex items-center gap-3">
                            <CatGif className="w-14 h-14" />
                            <div>
                                <h1 className="text-xl font-black text-blue-400 leading-none tracking-tight">Meow Macros</h1>
                                <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mt-1 italic">LOML Edition</p>
                            </div>
                        </div>
                    </header>

                    <div className="kawaii-card p-6 relative overflow-hidden">
                        <div className="flex justify-between items-end mb-6">
                            <div>
                                <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1 text-slate-300">Fuel Remaining</h2>
                                <p className={`text-5xl font-black tracking-tighter ${remainingCals < 0 ? 'text-red-400' : 'text-slate-700'}`}>{remainingCals} <span className="text-sm font-bold">kcal</span></p>
                            </div>
                            <div className="w-20 h-20 relative flex items-center justify-center animate-bounce-gentle text-blue-200">
                                <span className="material-icons-round text-6xl">favorite</span>
                                <span className="absolute text-[10px] font-black text-white">{Math.round((totalEatenCals/adjustedGoal)*100)}%</span>
                            </div>
                        </div>
                        <ProgressBar current={totals.p} max={GOALS.protein} colorClass="bg-blue-300" label="Protein" />
                        <ProgressBar current={totals.c} max={GOALS.carbs} colorClass="bg-yellow-200" label="Carbs" />
                        <ProgressBar current={totals.f} max={GOALS.fat} colorClass="bg-pink-300" label="Fat" />
                        <ProgressBar current={totals.fib} max={GOALS.fiber} colorClass="bg-emerald-300" label="Fiber" />
                    </div>

                    <button onClick={() => openAddFood()} className="w-full btn-mint p-4 flex items-center justify-center gap-3 text-lg">
                        <span className="material-icons-round text-2xl">add_circle</span> ADD FOOD
                    </button>

                    <div className="space-y-3">
                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Today's Bowl</h3>
                        {todayLog.length === 0 ? (
                            <div className="text-center py-10 opacity-30 italic"><p className="text-xs font-black">Waiting for your first entry...</p></div>
                        ) : todayLog.map(item => (
                            <div key={item.id} className="kawaii-card p-4 flex justify-between items-center shadow-sm">
                                <div>
                                    <p className="font-bold text-slate-600 text-sm leading-tight">{item.name}</p>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">
                                        {item.weight}{item.measure} • {Math.round(calcCals(item.c, item.p, item.f))} cal
                                    </p>
                                </div>
                                <button onClick={() => setData({...data, history: {...data.history, [date]: todayLog.filter(i=>i.id!==item.id)}})} className="bg-red-50 text-red-200 p-2 rounded-2xl"><span className="material-icons-round text-lg">delete</span></button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {view === 'fitness' && (
                <div className="pb-24 safe-pb space-y-6 px-2">
                    <h2 className="text-2xl font-black text-blue-400">Meow Muscles 💪</h2>
                    <div className="space-y-4">
                        {activeWorkout.map(ex => (
                            <div key={ex.id} className="kawaii-card p-4 flex justify-between items-center border-l-4 border-blue-300">
                                <div>
                                    <p className="font-bold text-slate-700">{ex.name}</p>
                                    <p className="text-xs text-slate-400 font-bold">{ex.sets} sets x {ex.reps} reps • {ex.weight} lbs {ex.difficulty}</p>
                                </div>
                                <button onClick={() => setActiveWorkout(activeWorkout.filter(i => i.id !== ex.id))} className="text-red-200"><span className="material-icons-round">remove_circle</span></button>
                            </div>
                        ))}
                        <button onClick={() => setWorkoutModalOpen(true)} className="w-full bg-white text-blue-300 border-2 border-blue-50 border-dashed p-5 rounded-[2rem] font-black uppercase flex items-center justify-center gap-2">
                            <span className="material-icons-round">add</span> Add Exercise
                        </button>
                    </div>
                    {activeWorkout.length > 0 && <button onClick={() => setFinishModalOpen(true)} className="w-full btn-mint p-5 mt-8 uppercase text-lg tracking-widest">Finish Workout</button>}
                </div>
            )}

            {view === 'library' && (
                <div className="pb-20 safe-pb px-2">
                    <h2 className="text-2xl font-black text-blue-400 mb-6">Food Library</h2>
                    <div className="relative mb-6">
                        <span className="material-icons-round absolute left-5 top-3.5 text-blue-200">search</span>
                        <input className="w-full bg-white pl-14 pr-6 py-4 rounded-3xl shadow-sm outline-none font-bold text-sm text-slate-600" placeholder="Search foods..." value={librarySearch} onChange={e => setLibrarySearch(e.target.value)} />
                    </div>
                    <div className="space-y-3">
                        {data.library.filter(i => i.name.toLowerCase().includes(librarySearch.toLowerCase())).map(item => (
                            <button key={item.id} onClick={() => openAddFood(item)} className="w-full kawaii-card p-5 flex justify-between items-center text-left hover:scale-[1.02] transition-transform">
                                <div><p className="font-bold text-slate-600 leading-none mb-1">{item.name}</p><p className="text-[10px] text-slate-400 font-black uppercase">Per {item.measure === 'unit' ? 'Unit' : '100g'} • P:{Math.round(item.protein)} C:{Math.round(item.carbs)}</p></div>
                                <div className="bg-blue-50 p-2.5 rounded-2xl text-blue-300"><span className="material-icons-round">add</span></div>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* NAV BAR */}
            <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[95%] max-w-[400px] bg-white/95 backdrop-blur-md shadow-2xl rounded-[2.5rem] p-2 flex justify-around items-center z-40 border border-white">
                <button onClick={() => setView('home')} className={`p-4 rounded-3xl transition-all ${view==='home'?'bg-blue-50 text-blue-400 shadow-inner':'text-slate-300'}`}><span className="material-icons-round text-2xl">home</span></button>
                <button onClick={() => setView('fitness')} className={`p-4 rounded-3xl transition-all ${view==='fitness'?'bg-blue-50 text-blue-400 shadow-inner':'text-slate-300'}`}><span className="material-icons-round text-2xl">fitness_center</span></button>
                <button onClick={() => setView('library')} className={`p-4 rounded-3xl transition-all ${view==='library'?'bg-blue-50 text-blue-400 shadow-inner':'text-slate-300'}`}><span className="material-icons-round text-2xl">menu_book</span></button>
            </nav>

            {/* ADD FOOD MODAL */}
            {modalOpen && (
                <div className="fixed inset-0 z-50 bg-blue-900/20 backdrop-blur-sm flex items-end justify-center p-4" onClick={() => setModalOpen(false)}>
                    <div className="bg-white w-full max-w-sm rounded-[3rem] p-8 shadow-2xl animate-in slide-in-from-bottom-10 border-4 border-blue-50" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-8">
                            <h2 className="text-xl font-black text-slate-700 uppercase tracking-tight">{editFood.name || 'Add Food'}</h2>
                            <button onClick={() => setModalOpen(false)} className="bg-slate-50 w-10 h-10 rounded-full flex items-center justify-center font-bold text-slate-400">&times;</button>
                        </div>
                        <div className="space-y-5">
                            <input className="kawaii-input w-full font-bold text-sm" value={editFood.name} onChange={e => setEditFood({...editFood, name: e.target.value})} placeholder="Food Name" />
                            <div>
                                <label className="text-[10px] font-black uppercase text-slate-400 ml-2 mb-1 block">Amount ({editFood.measure})</label>
                                <input type="number" className="kawaii-input w-full font-black text-4xl text-center text-blue-400" value={editFood.weight} onChange={e => handleWeightChange(e.target.value)} />
                            </div>
                            <div className="bg-slate-50 p-6 rounded-[2.5rem] border border-slate-100 grid grid-cols-4 gap-2 text-center">
                                {['carbs', 'protein', 'fat', 'fiber'].map(m => (
                                    <div key={m}>
                                        <p className="text-[8px] font-black text-slate-400 uppercase mb-1">{m.substring(0,3)}</p>
                                        <input type="number" className="w-full text-center bg-white rounded-lg p-1 font-bold text-[10px] text-slate-600 outline-none" value={editFood[m]} onChange={e => setEditFood({...editFood, [m]: Number(e.target.value)})} />
                                    </div>
                                ))}
                            </div>
                            <button onClick={handleAddFood} className="w-full btn-mint py-4 text-lg mt-2 uppercase tracking-widest">Add Entry</button>
                        </div>
                    </div>
                </div>
            )}

            {/* SUCCESS FEEDBACK */}
            {successModalData && (
                <div className="fixed inset-0 z-[100] bg-blue-100/90 backdrop-blur-sm flex items-center justify-center p-8 animate-pop" onClick={() => setSuccessModalData(null)}>
                    <div className="bg-white p-10 rounded-[3rem] shadow-2xl text-center border-4 border-blue-50">
                        <CatGif className="w-32 h-32 mx-auto mb-6" />
                        <h2 className="text-2xl font-black text-blue-400 mb-2">{successModalData.title}</h2>
                        <p className="text-lg text-slate-500 font-bold mb-6 italic">"{successModalData.message}"</p>
                        <p className="text-xs font-black text-blue-300 uppercase tracking-widest">{successModalData.subtext}</p>
                    </div>
                </div>
            )}

            {/* NEW EXERCISE MODAL */}
            {workoutModalOpen && (
                <div className="fixed inset-0 z-50 bg-blue-900/20 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setWorkoutModalOpen(false)}>
                    <div className="bg-white w-full max-w-sm rounded-[3rem] p-8 shadow-2xl border-4 border-blue-50" onClick={e => e.stopPropagation()}>
                        <h2 className="text-xl font-black text-slate-700 mb-8 uppercase tracking-tight">New Exercise</h2>
                        <div className="space-y-4">
                            <input className="kawaii-input w-full font-bold" value={newEx.name} onChange={e => setNewEx({...newEx, name: e.target.value})} placeholder="Exercise Name" />
                            <div className="grid grid-cols-2 gap-4">
                                <input type="number" className="kawaii-input w-full text-center" placeholder="Sets" value={newEx.sets} onChange={e => setNewEx({...newEx, sets: Number(e.target.value)})} />
                                <input type="number" className="kawaii-input w-full text-center" placeholder="Reps" value={newEx.reps} onChange={e => setNewEx({...newEx, reps: Number(e.target.value)})} />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <input type="number" className="kawaii-input w-full text-center" placeholder="Lbs" value={newEx.weight} onChange={e => setNewEx({...newEx, weight: Number(e.target.value)})} />
                                <select className="kawaii-input w-full text-center appearance-none cursor-pointer" value={newEx.difficulty} onChange={e => setNewEx({...newEx, difficulty: e.target.value})}>
                                    <option value="😺">😺 Easy</option>
                                    <option value="😼">😼 Mod</option>
                                    <option value="🙀">🙀 Hard</option>
                                    <option value="😵‍💫">😵‍💫 Fail</option>
                                </select>
                            </div>
                            <button onClick={handleAddExercise} className="w-full btn-mint py-4 mt-4">Add to List</button>
                        </div>
                    </div>
                </div>
            )}

            {/* FINISH MODAL */}
            {finishModalOpen && (
                <div className="fixed inset-0 z-50 bg-blue-900/20 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setFinishModalOpen(false)}>
                    <div className="bg-white w-full max-w-sm rounded-[3rem] p-10 shadow-2xl text-center border-4 border-blue-50" onClick={e => e.stopPropagation()}>
                        <h2 className="text-xl font-black text-blue-400 mb-8 uppercase">Report</h2>
                        <input type="number" className="kawaii-input w-full text-center text-6xl font-black text-blue-400 mb-10" value={workoutDuration} onChange={e => setWorkoutDuration(Number(e.target.value))} />
                        <button onClick={handleFinishWorkout} className="w-full btn-mint py-5 text-lg uppercase">Log & Finish</button>
                    </div>
                </div>
            )}
        </div>
    );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
