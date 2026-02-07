const { useState, useEffect, useMemo, useRef } = React;

// --- CONSTANTS: LOML EDITION ---
const GOALS = { 
    calories: 2450, 
    carbs: 305, 
    protein: 125, 
    fat: 80, 
    fiber: 30 
};

// USER STATS FOR EXERCISE MATH
const USER_WEIGHT_KG = 63.5; // 140 lbs
const MET_VALUE = 6.0;

// STABLE STATIC ASSETS
const WAITING_CAT = "https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Animals/Cat%20Face.png";
const HAPPY_CAT = "https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Animals/Smiling%20Cat%20with%20Heart-Eyes.png";
const MOCHI_LOGO = "https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Animals/Grinning%20Cat.png";

// FULL PRELOADED LIBRARY
const STARTER_LIBRARY = [
    { id: '1', name: 'Egg Whites', carbs: 0, protein: 11.7, fat: 0, fiber: 0, measure: 'g' },
    { id: '2', name: 'Greek Yogurt', carbs: 4.1, protein: 10.6, fat: 0, fiber: 0, measure: 'g' },
    { id: '3', name: 'Banana', carbs: 22, protein: 1, fat: 0, fiber: 2.5, measure: 'unit' },
    { id: '4', name: 'Salmon', carbs: 0, protein: 23.3, fat: 12, fiber: 0, measure: 'g' },
    { id: '5', name: 'Garbanzo Beans', carbs: 16.9, protein: 5.4, fat: 1.5, fiber: 4.6, measure: 'g' },
    { id: '6', name: 'Avocado', carbs: 8, protein: 2, fat: 14, fiber: 6, measure: 'g' },
    { id: '7', name: 'Quinoa', carbs: 26, protein: 5, fat: 2, fiber: 2, measure: 'g' },
    { id: '8', name: 'Chicken Breast', carbs: 0, protein: 31, fat: 3, fiber: 0, measure: 'g' },
    { id: '9', name: 'Ground Turkey', carbs: 0, protein: 20.6, fat: 7.3, fiber: 0, measure: 'g' },
    { id: '10', name: 'Black Beans', carbs: 16, protein: 6, fat: 0, fiber: 5, measure: 'g' },
    { id: '11', name: 'Whole Egg', carbs: 1, protein: 6, fat: 5, fiber: 0, measure: 'unit' },
    { id: '12', name: 'Apple', carbs: 10, protein: 0.3, fat: 0.2, fiber: 2.4, measure: 'unit' },
    { id: '13', name: 'Corn', carbs: 7.2, protein: 0.8, fat: 0.4, fiber: 2, measure: 'g' },
    { id: '14', name: 'Mixed Berries', carbs: 9.1, protein: 0.5, fat: 0.3, fiber: 3, measure: 'g' }
];

const MOTIVATION_QUOTES = [
    "Stay Paws-itive! 🐾", "Purr-fect session! ✨", "You're doing clawsome! 😻",
    "Feline strong today! 💪", "Meow-velous progress! ⭐"
];

// --- HELPERS ---
const getLocalYMD = () => {
    const now = new Date();
    const local = new Date(now.getTime() - (now.getTimezoneOffset() * 60000));
    return local.toISOString().split('T')[0];
};

const calcCals = (c, p, f) => Math.round((c * 4) + (p * 4) + (f * 9));

// --- REFACTORED CAT ICON COMPONENT ---
const CatIcon = ({ mood }) => {
    return (
        <div style={{ height: '120px', width: '120px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <img 
                src={mood === 'happy' ? HAPPY_CAT : WAITING_CAT} 
                style={{ height: '100%', width: '100%', objectFit: 'contain' }} 
                alt="Cat mascot"
            />
        </div>
    );
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
    const [data, setData] = useState({ 
        history: {}, 
        fitnessHistory: {}, 
        weightLog: {}, 
        library: STARTER_LIBRARY 
    });
    const [date, setDate] = useState(getLocalYMD());
    
    // UI State
    const [foodModal, setFoodModal] = useState(false);
    const [libraryEditModal, setLibraryEditModal] = useState(false);
    const [workoutModal, setWorkoutModal] = useState(false);
    const [weightModal, setWeightModal] = useState(false);
    const [finishWorkoutModal, setFinishWorkoutModal] = useState(false);
    const [successModal, setSuccessModal] = useState(null); 

    // Form States
    const [editFood, setEditFood] = useState({ name: '', weight: 100, carbs: 0, protein: 0, fat: 0, fiber: 0, measure: 'g' });
    const [selectedLibItem, setSelectedLibItem] = useState(null);
    const [activeWorkout, setActiveWorkout] = useState([]);
    const [newEx, setNewEx] = useState({ name: '', sets: 1, reps: 10, weight: 0, difficulty: '😏' });
    const [workoutDuration, setWorkoutDuration] = useState(30);
    const [searchQuery, setSearchQuery] = useState('');
    const [todayWeight, setTodayWeight] = useState('');

    // Persistence Logic
    useEffect(() => {
        try {
            const saved = localStorage.getItem('meow_loml_v4');
            if (saved) setData(JSON.parse(saved));
        } catch (e) { console.error("Data Load Error", e); }
    }, []);

    useEffect(() => {
        localStorage.setItem('meow_loml_v4', JSON.stringify(data));
    }, [data]);

    // Totals
    const todayLog = data.history[date] || [];
    const totals = todayLog.reduce((acc, item) => ({
        c: acc.c + (parseFloat(item.c) || 0), p: acc.p + (parseFloat(item.p) || 0), f: acc.f + (parseFloat(item.f) || 0), fib: acc.fib + (parseFloat(item.fib) || 0)
    }), { c: 0, p: 0, f: 0, fib: 0 });
    
    const todayWorkouts = data.fitnessHistory[date] || [];
    const totalBurnedCals = todayWorkouts.reduce((acc, w) => acc + (w.calories || 0), 0);
    const totalEatenCals = calcCals(totals.c, totals.p, totals.f);
    const adjustedGoal = GOALS.calories + totalBurnedCals;
    const remainingCals = adjustedGoal - totalEatenCals;

    // --- ACTIONS ---
    const handleLogEntry = (entry) => {
        setData(prev => ({
            ...prev,
            history: { ...prev.history, [date]: [entry, ...(prev.history[date] || [])] }
        }));
        setFoodModal(false);
        setView('home');
    };

    const handleWeightSave = () => {
        setData(prev => ({
            ...prev,
            weightLog: { ...prev.weightLog, [date]: Number(todayWeight) }
        }));
        setWeightModal(false);
        setSuccessModal({ title: "Weight Logged", message: "Progress recorded!", subtext: `${todayWeight} lbs` });
    };

    const handleFinishWorkout = () => {
        // PERSONALIZED CALORIE MATH: (6.0 * 63.5 * (Minutes / 60))
        const burned = Math.round(6.0 * USER_WEIGHT_KG * (workoutDuration / 60));
        const log = { id: Date.now(), exercises: activeWorkout, duration: workoutDuration, calories: burned, quote: MOTIVATION_QUOTES[Math.floor(Math.random() * MOTIVATION_QUOTES.length)] };
        setData(prev => ({
            ...prev,
            fitnessHistory: { ...prev.fitnessHistory, [date]: [log, ...(prev.fitnessHistory[date] || [])] }
        }));
        setFinishWorkoutModal(false);
        setWorkoutModal(false);
        setActiveWorkout([]);
        setSuccessModal({ title: "Workout Saved", message: log.quote, subtext: `Burned: ${burned} kcal` });
    };

    const handleLibrarySave = () => {
        const newItem = { ...editFood, id: editFood.id || Date.now() };
        setData(prev => ({
            ...prev,
            library: prev.library.find(i => i.id === newItem.id) 
                ? prev.library.map(i => i.id === newItem.id ? newItem : i) 
                : [newItem, ...prev.library]
        }));
        setLibraryEditModal(false);
    };

    const updateMacrosRealTime = (weight, measure) => {
        if (!selectedLibItem) {
            setEditFood(prev => ({ ...prev, weight: Number(weight), measure: measure }));
            return;
        }
        const base = measure === 'unit' ? 1 : 100;
        const ratio = Number(weight) / base;
        setEditFood(prev => ({
            ...prev,
            weight: Number(weight),
            measure: measure,
            carbs: (selectedLibItem.carbs * ratio).toFixed(1),
            protein: (selectedLibItem.protein * ratio).toFixed(1),
            fat: (selectedLibItem.fat * ratio).toFixed(1),
            fiber: (selectedLibItem.fiber * ratio).toFixed(1)
        }));
    };

    return (
        <div className="max-w-md mx-auto min-h-screen px-4 py-6 relative font-nunito text-slate-800">
            {/* Background Floral Overlay */}
            <span className="fixed top-10 left-5 opacity-20 text-3xl pointer-events-none">🌸</span>
            <span className="fixed bottom-20 right-5 opacity-20 text-3xl pointer-events-none">🌼</span>

            {/* VIEWS */}
            {view === 'home' && (
                <div className="space-y-6 pb-24 safe-pb px-2">
                    <header className="flex justify-between items-center mb-2">
                        <div className="flex items-center gap-3">
                            {/* Mochi Logo Fix: Explicit Dimensions and Stable Raw Link */}
                            <img 
                                src={MOCHI_LOGO} 
                                style={{ display: 'block', height: '40px', width: '40px', objectFit: 'contain' }} 
                                alt="Mochi Logo" 
                            />
                            <div><h1 className="text-xl font-black text-blue-400 leading-none">Meow Macros</h1><p className="text-[10px] font-black text-slate-300 uppercase italic">LOML Edition</p></div>
                        </div>
                        <div className="flex gap-2">
                             <button onClick={() => { setTodayWeight(data.weightLog[date] || ''); setWeightModal(true); }} className="bg-white p-3 rounded-2xl shadow-sm border border-slate-50 text-blue-300 active:scale-95 transition-transform"><span className="material-icons-round">scale</span></button>
                        </div>
                    </header>

                    <div className="kawaii-card p-6 relative overflow-hidden">
                        <div className="flex justify-between items-end mb-6">
                            <div><h2 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1 opacity-50">Fuel Remaining</h2><p className={`text-5xl font-black tracking-tighter ${remainingCals < 0 ? 'text-red-400' : 'text-slate-700'}`}>{remainingCals} <span className="text-sm font-bold">kcal</span></p></div>
                            <div className="w-20 h-20 relative flex items-center justify-center animate-bounce text-blue-200">
                                <CatIcon mood={todayLog.length > 0 ? 'happy' : 'waiting'} />
                            </div>
                        </div>
                        <ProgressBar current={totals.c} max={GOALS.carbs} colorClass="bg-yellow-200" label="Carbs" />
                        <ProgressBar current={totals.p} max={GOALS.protein} colorClass="bg-blue-300" label="Protein" />
                        <ProgressBar current={totals.f} max={GOALS.fat} colorClass="bg-pink-300" label="Fat" />
                        <ProgressBar current={totals.fib} max={GOALS.fiber} colorClass="bg-emerald-300" label="Fiber" />
                    </div>

                    <button onClick={() => { setEditFood({ name: '', weight: 100, carbs: 0, protein: 0, fat: 0, fiber: 0, measure: 'g' }); setSelectedLibItem(null); setFoodModal(true); }} className="w-full bg-[#34d399] p-4 rounded-3xl text-white flex items-center justify-center gap-3 text-lg font-black shadow-lg shadow-emerald-50 active:scale-95 transition-all"><span className="material-icons-round text-2xl">add_circle</span> ADD FOOD</button>

                    <div className="space-y-3">
                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Today's Bowl</h3>
                        {todayLog.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-10 opacity-30">
                                <CatIcon mood="waiting" />
                                <div className="italic font-black text-xs uppercase tracking-widest mt-4">Empty bowl... 😿</div>
                            </div>
                        ) : todayLog.map(item => (
                            <div key={item.id} className="kawaii-card p-4 flex justify-between items-center shadow-sm">
                                <div><p className="font-bold text-slate-600 text-sm">{item.name}</p><p className="text-[10px] text-slate-400 font-bold uppercase mt-1">{item.weight}{item.measure} • {Math.round(calcCals(item.c, item.p, item.f))} cal</p></div>
                                <button onClick={() => setData(prev => ({...prev, history: {...prev.history, [date]: (prev.history[date] || []).filter(i=>i.id!==item.id)}}))} className="bg-red-50 text-red-200 p-2 rounded-2xl transition-colors hover:bg-red-100"><span className="material-icons-round text-lg">delete</span></button>
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
                                <div><p className="font-bold text-slate-700">{ex.name}</p><p className="text-xs text-slate-400 font-bold">{ex.sets} Sets x {ex.reps} Reps • {ex.weight} Lbs {ex.difficulty}</p></div>
                                <button onClick={() => setActiveWorkout(activeWorkout.filter(i => i.id !== ex.id))} className="text-red-200 transition-colors hover:text-red-400"><span className="material-icons-round">remove_circle</span></button>
                            </div>
                        ))}
                        <button onClick={() => setWorkoutModal(true)} className="w-full bg-white text-blue-300 border-2 border-blue-50 border-dashed p-6 rounded-[2.5rem] font-black uppercase flex items-center justify-center gap-2 hover:bg-blue-50 transition-colors shadow-sm">Add Exercise</button>
                    </div>
                    {activeWorkout.length > 0 && <button onClick={() => setFinishWorkoutModal(true)} className="w-full bg-[#34d399] p-5 mt-8 rounded-3xl text-white font-black uppercase tracking-widest shadow-lg active:scale-[0.98] transition-all">Finish Session</button>}
                </div>
            )}

            {view === 'trends' && (
                <div className="pb-24 safe-pb space-y-6 px-2">
                    <h2 className="text-2xl font-black text-blue-400">Your Bloom 🌸</h2>
                    <div className="kawaii-card p-6">
                        <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Weight Journey</h3>
                        <div className="flex items-end justify-between h-40 gap-1 px-2 border-b border-slate-100">
                            {Object.keys(data.weightLog).sort().slice(-7).map(d => (
                                <div key={d} className="flex-1 flex flex-col items-center group">
                                    <div className="w-full bg-blue-100 rounded-t-lg transition-all" style={{ height: `${Math.min(100, (data.weightLog[d] / 200) * 100)}%` }}></div>
                                    <span className="text-[7px] font-bold text-slate-300 uppercase mt-2">{d.slice(-5)}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="space-y-4">
                        {Object.keys(data.fitnessHistory).length === 0 ? <p className="text-center opacity-30 text-xs italic py-10">No sessions logged yet...</p> : 
                            Object.keys(data.fitnessHistory).sort().reverse().map(d => (
                                <div key={d} className="kawaii-card p-5 border-l-4 border-emerald-300 shadow-sm transition-transform hover:scale-[1.01]">
                                    <p className="font-black text-blue-500 uppercase text-xs mb-1">{data.fitnessHistory[d][0].quote}</p>
                                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">{d} • {data.fitnessHistory[d][0].calories} kcal</p>
                                </div>
                            ))
                        }
                    </div>
                </div>
            )}

            {view === 'library' && (
                <div className="pb-24 safe-pb px-2">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-black text-blue-400">Library</h2>
                        <button onClick={() => { setEditFood({ name: '', weight: 100, carbs: 0, protein: 0, fat: 0, fiber: 0, measure: 'g' }); setSelectedLibItem(null); setLibraryEditModal(true); }} className="bg-white p-3 rounded-2xl shadow-sm text-blue-300 transition-colors hover:text-blue-500"><span className="material-icons-round">post_add</span></button>
                    </div>
                    <div className="relative mb-6">
                        <span className="material-icons-round absolute left-5 top-3.5 text-blue-200">search</span>
                        <input className="w-full bg-white pl-14 pr-6 py-4 rounded-3xl shadow-sm outline-none font-bold text-sm text-slate-600 focus:ring-4 ring-blue-50 transition-all" placeholder="Search foods..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
                    </div>
                    <div className="space-y-3">
                        {data.library.filter(i => i.name.toLowerCase().includes(searchQuery.toLowerCase())).map(item => (
                            <div key={item.id} className="kawaii-card p-5 flex justify-between items-center shadow-sm group transition-all hover:translate-x-1">
                                <div onClick={() => { setSelectedLibItem(item); setEditFood({ ...item, weight: item.measure === 'unit' ? 1 : 100 }); setFoodModal(true); }} className="flex-1 cursor-pointer">
                                    <p className="font-bold text-slate-600 mb-1">{item.name}</p>
                                    <p className="text-[10px] text-slate-400 font-black uppercase">Per {item.measure === 'unit' ? 'Unit' : '100g'} • P:{Math.round(item.protein)} C:{Math.round(item.carbs)}</p>
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={() => { setEditFood(item); setSelectedLibItem(item); setLibraryEditModal(true); }} className="p-2 text-blue-200 hover:text-blue-400 transition-colors"><span className="material-icons-round text-lg">edit</span></button>
                                    <button onClick={() => setData(prev => ({ ...prev, library: prev.library.filter(i => i.id !== item.id) }))} className="p-2 text-red-100 hover:text-red-400 transition-colors"><span className="material-icons-round text-lg">delete</span></button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* NAV BAR */}
            <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[95%] max-w-[400px] bg-white/95 backdrop-blur-md shadow-2xl rounded-[2.5rem] p-2 flex justify-around items-center z-40 border border-white">
                <button onClick={() => setView('home')} className={`p-4 rounded-3xl transition-all ${view==='home'?'bg-blue-50 text-blue-400 shadow-inner':'text-slate-300'}`}><span className="material-icons-round">home</span></button>
                <button onClick={() => setView('fitness')} className={`p-4 rounded-3xl transition-all ${view==='fitness'?'bg-blue-50 text-blue-400 shadow-inner':'text-slate-300'}`}><span className="material-icons-round">fitness_center</span></button>
                <button onClick={() => setView('trends')} className={`p-4 rounded-3xl transition-all ${view==='trends'?'bg-blue-50 text-blue-400 shadow-inner':'text-slate-300'}`}><span className="material-icons-round">insights</span></button>
                <button onClick={() => setView('library')} className={`p-4 rounded-3xl transition-all ${view==='library'?'bg-blue-50 text-blue-400 shadow-inner':'text-slate-300'}`}><span className="material-icons-round">menu_book</span></button>
            </nav>

            {/* FOOD MODAL & LIBRARY EDIT SHARED */}
            {(foodModal || libraryEditModal) && (
                <div className="fixed inset-0 z-[120] bg-blue-900/20 backdrop-blur-sm flex items-end justify-center p-4" onClick={() => { setFoodModal(false); setLibraryEditModal(false); }}>
                    <div className="bg-white w-full max-w-sm rounded-[3rem] p-8 shadow-2xl border-4 border-blue-50 animate-pop overflow-hidden" onClick={e => e.stopPropagation()}>
                        <h2 className="text-xl font-black text-slate-700 uppercase mb-4 tracking-tight">{libraryEditModal ? (editFood.id ? "Edit Library" : "New Item") : editFood.name || "Add Entry"}</h2>
                        
                        <div className="space-y-4">
                            {(libraryEditModal || !editFood.id) && <input className="kawaii-input w-full font-bold" value={editFood.name} onChange={e => setEditFood({ ...editFood, name: e.target.value })} placeholder="Food Name" />}
                            
                            {/* Toggle Interaction Logic */}
                            <div className="flex bg-slate-100 p-1 rounded-2xl relative">
                                <button 
                                    type="button"
                                    onClick={(e) => { e.preventDefault(); updateMacrosRealTime(editFood.weight, 'g'); }} 
                                    style={{ zIndex: 9999, position: 'relative', pointerEvents: 'auto' }}
                                    className={`flex-1 py-2 text-[10px] font-black rounded-xl transition-all ${editFood.measure === 'g' ? 'bg-white shadow-sm' : 'text-slate-400'}`}
                                >
                                    GRAMS
                                </button>
                                <button 
                                    type="button"
                                    onClick={(e) => { e.preventDefault(); updateMacrosRealTime(editFood.weight, 'unit'); }} 
                                    style={{ zIndex: 9999, position: 'relative', pointerEvents: 'auto' }}
                                    className={`flex-1 py-2 text-[10px] font-black rounded-xl transition-all ${editFood.measure === 'unit' ? 'bg-white shadow-sm' : 'text-slate-400'}`}
                                >
                                    UNITS
                                </button>
                            </div>

                            <div>
                                <label className="text-[10px] font-black uppercase text-slate-400 ml-2 mb-1 block">
                                    {editFood.measure === 'g' ? 'Amount (grams)' : 'Quantity (units)'}
                                </label>
                                <input 
                                    type="number" 
                                    placeholder={editFood.measure === 'g' ? "grams" : "quantity"}
                                    className="kawaii-input w-full font-black text-4xl text-center text-blue-400" 
                                    value={editFood.weight} 
                                    onChange={e => updateMacrosRealTime(e.target.value, editFood.measure)} 
                                />
                            </div>
                            <div className="grid grid-cols-4 gap-2 text-center bg-slate-50 p-4 rounded-3xl">
                                {['carbs', 'protein', 'fat', 'fiber'].map(m => (
                                    <div key={m}>
                                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-tighter">{m.slice(0,3)}</p>
                                        <input type="number" className="w-full text-center bg-white font-bold text-[10px] p-1 rounded-lg outline-none" value={editFood[m]} onChange={e => setEditFood({ ...editFood, [m]: Number(e.target.value) })} />
                                    </div>
                                ))}
                            </div>
                            <button onClick={libraryEditModal ? handleLibrarySave : () => handleLogEntry({ ...editFood, id: Date.now(), c: Number(editFood.carbs), p: Number(editFood.protein), f: Number(editFood.fat), fib: Number(editFood.fiber) })} className="w-full bg-[#34d399] py-4 text-white rounded-2xl font-black uppercase tracking-widest shadow-lg active:scale-[0.98] transition-all">{libraryEditModal ? "Save to Library" : "Add to Bowl"}</button>
                        </div>
                    </div>
                </div>
            )}

            {/* WEIGHT MODAL */}
            {weightModal && (
                <div className="fixed inset-0 z-[120] bg-blue-900/20 backdrop-blur-sm flex items-center justify-center p-6" onClick={() => setWeightModal(false)}>
                    <div className="bg-white w-full max-w-xs rounded-[3rem] p-8 shadow-2xl border-4 border-blue-50 text-center animate-pop" onClick={e => e.stopPropagation()}>
                        <h2 className="text-xl font-black text-blue-400 mb-6 uppercase tracking-widest">Weight Log</h2>
                        <input type="number" className="kawaii-input w-full text-center text-5xl font-black text-blue-400 mb-8 outline-none" value={todayWeight} onChange={e => setTodayWeight(e.target.value)} placeholder="0.0" />
                        <button onClick={handleWeightSave} className="w-full bg-[#34d399] py-5 text-white rounded-2xl font-black uppercase shadow-lg active:scale-[0.98] transition-all">Save Lbs</button>
                    </div>
                </div>
            )}

            {/* NEW EXERCISE MODAL */}
            {workoutModal && (
                <div className="fixed inset-0 z-[120] bg-blue-900/20 backdrop-blur-sm flex items-center justify-center p-6" onClick={() => setWorkoutModal(false)}>
                    <div className="bg-white w-full max-w-sm rounded-[3rem] p-8 shadow-2xl border-4 border-blue-50 animate-pop" onClick={e => e.stopPropagation()}>
                        <h2 className="text-xl font-black text-slate-700 mb-6 uppercase tracking-tight">New Move</h2>
                        <div className="space-y-4">
                            <input className="kawaii-input w-full font-bold outline-none" value={newEx.name} onChange={e => setNewEx({ ...newEx, name: e.target.value })} placeholder="Exercise Name" />
                            <div className="grid grid-cols-2 gap-4">
                                <div><label className="text-[8px] font-black uppercase text-slate-400 ml-2">Sets</label><input type="number" className="kawaii-input w-full text-center outline-none" value={newEx.sets} onChange={e => setNewEx({ ...newEx, sets: Number(e.target.value) })} /></div>
                                <div><label className="text-[8px] font-black uppercase text-slate-400 ml-2">Reps</label><input type="number" className="kawaii-input w-full text-center outline-none" value={newEx.reps} onChange={e => setNewEx({ ...newEx, reps: Number(e.target.value) })} /></div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div><label className="text-[8px] font-black uppercase text-slate-400 ml-2">Lbs</label><input type="number" className="kawaii-input w-full text-center outline-none" value={newEx.weight} onChange={e => setNewEx({ ...newEx, weight: Number(e.target.value) })} /></div>
                                <div><label className="text-[8px] font-black uppercase text-slate-400 ml-2">Mood</label><select className="kawaii-input w-full text-center appearance-none cursor-pointer outline-none" value={newEx.difficulty} onChange={e => setNewEx({ ...newEx, difficulty: e.target.value })}>
                                    <option value="😺">😺 Easy</option><option value="😼">😼 Mod</option><option value="🙀">🙀 Hard</option><option value="😵‍💫">😵‍💫 Fail</option>
                                </select></div>
                            </div>
                            <button onClick={() => { if (newEx.name) { setActiveWorkout([...activeWorkout, { ...newEx, id: Date.now() }]); setWorkoutModal(false); setNewEx({ name: '', sets: 1, reps: 10, weight: 0, difficulty: '😏' }); } }} className="w-full bg-blue-300 py-4 text-white rounded-2xl font-black uppercase shadow-md active:scale-[0.98] transition-all">Add to List</button>
                        </div>
                    </div>
                </div>
            )}

            {/* FINISH WORKOUT MODAL (MINUTES) */}
            {finishWorkoutModal && (
                <div className="fixed inset-0 z-[130] bg-blue-900/20 backdrop-blur-sm flex items-center justify-center p-6" onClick={() => setFinishWorkoutModal(false)}>
                    <div className="bg-white w-full max-w-xs rounded-[3rem] p-10 shadow-2xl text-center border-4 border-blue-50 animate-pop" onClick={e => e.stopPropagation()}>
                        <h2 className="text-xl font-black text-blue-400 mb-8 uppercase leading-tight">Total Minutes?</h2>
                        <input type="number" className="kawaii-input w-full text-center text-6xl font-black text-blue-400 mb-10 outline-none" value={workoutDuration} onChange={e => setWorkoutDuration(Number(e.target.value))} />
                        <button onClick={handleFinishWorkout} className="w-full bg-[#34d399] py-5 text-white rounded-2xl font-black uppercase shadow-lg active:scale-[0.98] transition-all">Complete Mission</button>
                    </div>
                </div>
            )}

            {/* SUCCESS FEEDBACK */}
            {successModal && (
                <div className="fixed inset-0 z-[200] bg-blue-100/90 backdrop-blur-sm flex items-center justify-center p-8 animate-pop" onClick={() => setSuccessModal(null)}>
                    <div className="bg-white p-10 rounded-[3rem] shadow-2xl text-center border-4 border-blue-50">
                        <div className="w-24 h-24 mx-auto mb-6 bg-blue-50 rounded-3xl flex items-center justify-center">
                            <CatIcon mood="happy" />
                        </div>
                        <h2 className="text-2xl font-black text-blue-400 mb-2 tracking-tight">{successModal.title}</h2>
                        <p className="text-lg text-slate-500 font-bold mb-6 italic leading-snug">"{successModal.message}"</p>
                        <p className="text-xs font-black text-blue-300 uppercase tracking-[0.2em]">{successModal.subtext}</p>
                    </div>
                </div>
            )}
        </div>
    );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
