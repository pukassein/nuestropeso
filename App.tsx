
import React, { useCallback, useState, useEffect, useMemo } from 'react';
import { GENERIC_MESSAGES } from './constants';
import { User, WeightEntry } from './types';
import * as dataService from './services/dataService';
import { firebaseConfig } from './firebaseConfig';

const WeightGraph: React.FC<{ history: WeightEntry[]; goalWeight: number }> = ({ history, goalWeight }) => {
  const SvgWidth = 300;
  const SvgHeight = 150;
  const padding = 20;

  const data = useMemo(() => {
     if (history.length < 2) return null;

      const weights = history.map(e => e.weight);
      const minWeight = Math.min(...weights, goalWeight) - 2;
      const maxWeight = Math.max(...weights, goalWeight) + 2;
      const weightRange = maxWeight - minWeight;

      if (weightRange === 0) return null;

      const points = history.map((entry, i) => {
          const x = (i / (history.length - 1)) * (SvgWidth - 2 * padding) + padding;
          const y = SvgHeight - ((entry.weight - minWeight) / weightRange) * (SvgHeight - 2 * padding) - padding;
          return { x, y, entry };
      });

      const goalY = SvgHeight - ((goalWeight - minWeight) / weightRange) * (SvgHeight - 2 * padding) - padding;

      const pathData = points.map(p => `${p.x},${p.y}`).join(' ');
      
      return { points, pathData, goalY };
  }, [history, goalWeight]);

  if (history.length < 2 || !data) {
    return (
      <div className="flex items-center justify-center h-[170px] text-light-text text-sm bg-slate-50 rounded-lg">
        <p>Log at least 2 entries to see your progress graph.</p>
      </div>
    );
  }
  
  const { points, pathData, goalY } = data;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(date);
  }

  return (
    <div className="relative">
      <svg viewBox={`0 0 ${SvgWidth} ${SvgHeight}`} className="w-full h-auto">
        {/* Goal Line */}
        <line x1={padding} y1={goalY} x2={SvgWidth - padding} y2={goalY} strokeDasharray="4 2" stroke="#10b981" strokeWidth="1"/>
        <text x={padding + 5} y={goalY - 4} fill="#10b981" fontSize="10" textAnchor="start">Goal: {goalWeight}kg</text>

        {/* Weight Path */}
        <polyline fill="none" stroke="#4f46e5" strokeWidth="2" points={pathData} />

        {/* Data Points */}
        {points.map(({ x, y, entry }, i) => (
          <g key={i}>
            <circle cx={x} cy={y} r="3" fill="#4f46e5" stroke="white" strokeWidth="1.5" />
            <title>{`${entry.weight}kg on ${formatDate(entry.date)}`}</title>
          </g>
        ))}

        {/* Axis Labels */}
        <text x={padding} y={SvgHeight - 5} fill="#64748b" fontSize="10">{formatDate(history[0].date)}</text>
        <text x={SvgWidth - padding} y={SvgHeight - 5} fill="#64748b" fontSize="10" textAnchor="end">{formatDate(history[history.length - 1].date)}</text>
      </svg>
    </div>
  );
};

const Modal: React.FC<{ children: React.ReactNode; onClose: () => void; title: string; }> = ({ children, onClose, title }) => {
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onClose]);

    return (
        <div
            className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 transition-opacity animate-fade-in"
            onClick={onClose}
            aria-modal="true"
            role="dialog"
        >
            <div
                className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md m-4 transform transition-all animate-slide-up"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-200">
                    <h3 className="text-xl font-bold text-dark-text">{title}</h3>
                    <button onClick={onClose} className="text-light-text hover:text-dark-text p-1 rounded-full hover:bg-slate-100 transition-colors" aria-label="Close modal">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                {children}
            </div>
        </div>
    );
};

const WeightHistoryModal: React.FC<{ user: User; onClose: () => void; onDelete: (id: string) => void; }> = ({ user, onClose, onDelete }) => {
    const sortedHistory = useMemo(() => 
        [...user.weightHistory].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
        [user.weightHistory]
    );

    const handleDelete = (id: string) => {
        if (window.confirm('Are you sure you want to delete this entry? This action cannot be undone.')) {
            onDelete(id);
        }
    };

    return (
        <Modal onClose={onClose} title={`${user.name}'s History`}>
            <div className="max-h-80 overflow-y-auto">
                {sortedHistory.length > 0 ? (
                  <table className="w-full text-left table-auto">
                      <thead className="sticky top-0 bg-slate-50 z-10">
                          <tr>
                              <th className="p-3 text-sm font-semibold text-dark-text rounded-l-lg">Date</th>
                              <th className="p-3 text-sm font-semibold text-dark-text">Weight (kg)</th>
                              <th className="p-3 text-sm font-semibold text-dark-text text-right rounded-r-lg">Actions</th>
                          </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                          {sortedHistory.map((entry) => (
                              <tr key={entry.id} className="hover:bg-slate-50">
                                  <td className="p-3 text-sm text-light-text">{new Date(entry.date).toLocaleString('en-CA', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</td>
                                  <td className="p-3 text-sm text-dark-text font-medium">{entry.weight.toFixed(1)}</td>
                                  <td className="p-3 text-right">
                                      <button onClick={() => handleDelete(entry.id)} className="text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-red-100 transition-colors" aria-label={`Delete entry for ${entry.date}`} title="Delete entry">
                                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 012 0v6a1 1 0 11-2 0V8z" clipRule="evenodd" />
                                          </svg>
                                      </button>
                                  </td>
                              </tr>
                          ))}
                      </tbody>
                  </table>
                ) : (
                    <p className="text-center text-light-text p-8">No weight entries yet.</p>
                )}
            </div>
        </Modal>
    );
};

const EditUserModal: React.FC<{ user: User; onClose: () => void; onSave: (goalWeight: number) => void }> = ({ user, onClose, onSave }) => {
    const [goalWeight, setGoalWeight] = useState(user.goalWeight.toString());

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        const goal = parseFloat(goalWeight);
        if (!isNaN(goal) && goal > 0) {
            onSave(goal);
            onClose();
        }
    };

    return (
        <Modal onClose={onClose} title={`Edit ${user.name}'s Goal`}>
            <form onSubmit={handleSave} className="flex flex-col gap-4">
                <div>
                    <label htmlFor="goalWeight" className="block text-sm font-medium text-light-text mb-1">Goal Weight (kg)</label>
                    <input
                        id="goalWeight"
                        type="number"
                        step="0.1"
                        value={goalWeight}
                        onChange={(e) => setGoalWeight(e.target.value)}
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-brand-primary transition"
                    />
                </div>
                <div className="flex justify-end gap-3 mt-4">
                    <button type="button" onClick={onClose} className="bg-slate-200 text-dark-text font-semibold px-4 py-2 rounded-lg hover:bg-slate-300 transition shadow-sm">Cancel</button>
                    <button type="submit" className="bg-brand-primary text-white font-semibold px-4 py-2 rounded-lg hover:bg-opacity-90 transition shadow-sm">Save</button>
                </div>
            </form>
        </Modal>
    );
};


const UserCard: React.FC<{ 
  user: User; 
  otherUser: User; 
  onAddWeight: (userId: 'hussein' | 'rola', weight: number) => void;
  onUpdateDetails: (userId: 'hussein' | 'rola', goalWeight: number) => void;
  onDeleteWeight: (userId: 'hussein' | 'rola', id: string) => void;
}> = ({ user, otherUser, onAddWeight, onUpdateDetails, onDeleteWeight }) => {
    const [weightInput, setWeightInput] = useState<string>('');
    const [isHistoryVisible, setIsHistoryVisible] = useState(false);
    const [isEditModalVisible, setIsEditModalVisible] = useState(false);

    const motivationalMessage = useMemo(() => {
        if (user.weightHistory.length === 0) {
            return `Welcome, ${user.name}! Add your first weight to start your journey.`;
        }
        const messageIndex = user.weightHistory.length % GENERIC_MESSAGES.length;
        return GENERIC_MESSAGES[messageIndex];
    }, [user.name, user.weightHistory.length]);

    const startWeight = user.weightHistory[0]?.weight;
    const currentWeight = user.weightHistory[user.weightHistory.length - 1]?.weight;
    const weightToGo = currentWeight ? (currentWeight - user.goalWeight).toFixed(1) : 'N/A';

    const handleAddWeightSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const weightValue = parseFloat(weightInput);
        if (!isNaN(weightValue) && weightValue > 0) {
            onAddWeight(user.id, weightValue);
            setWeightInput('');
        }
    };

    const handleSaveDetails = (goalWeight: number) => {
        onUpdateDetails(user.id, goalWeight);
    };

    const handleDeleteWeight = (id: string) => {
        onDeleteWeight(user.id, id);
    };
    
    const otherUserCurrentWeight = otherUser.weightHistory[otherUser.weightHistory.length - 1]?.weight;

    return (
      <>
        <div className="bg-white rounded-2xl shadow-lg p-6 flex flex-col gap-6 transform hover:scale-[1.02] transition-transform duration-300 relative">
            <div className="absolute top-4 right-4 flex items-center gap-1">
                <button 
                  onClick={() => setIsEditModalVisible(true)} 
                  className="p-2 text-light-text hover:text-brand-primary transition-colors rounded-full hover:bg-slate-100"
                  aria-label="Edit start and goal weights"
                  title="Edit details"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" />
                    <path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" />
                  </svg>
                </button>
                <button 
                  onClick={() => setIsHistoryVisible(true)} 
                  className="p-2 text-light-text hover:text-brand-primary transition-colors rounded-full hover:bg-slate-100"
                  aria-label="View weight history"
                  title="View weight history"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                  </svg>
                </button>
            </div>
            <h2 className="text-2xl font-bold text-dark-text text-center">{user.name}'s Journey</h2>
            
            <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                    <p className="text-sm text-light-text">Start</p>
                    <p className="text-lg font-semibold text-dark-text">{startWeight ? `${startWeight.toFixed(1)}kg` : 'N/A'}</p>
                </div>
                <div>
                    <p className="text-sm text-light-text">Current</p>
                    <p className="text-xl font-bold text-brand-primary">{currentWeight ? `${currentWeight.toFixed(1)}kg` : 'N/A'}</p>
                </div>
                <div>
                    <p className="text-sm text-light-text">Goal</p>
                    <p className="text-lg font-semibold text-dark-text">{user.goalWeight.toFixed(1)}kg</p>
                </div>
            </div>

            <div className="text-center bg-indigo-50 text-brand-primary font-semibold py-2 rounded-lg">
                {currentWeight === undefined ? 'Log a weight to begin!' : parseFloat(weightToGo) > 0 ? `${weightToGo} kg to go!` : 'Goal Reached! 🎉'}
            </div>

            <form onSubmit={handleAddWeightSubmit} className="flex gap-2 items-center">
                <input
                    type="number"
                    step="0.1"
                    value={weightInput}
                    onChange={(e) => setWeightInput(e.target.value)}
                    placeholder={`Today's weight (kg)`}
                    aria-label={`Enter weight for ${user.name}`}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-brand-primary transition"
                />
                <button type="submit" className="bg-brand-primary text-white font-semibold px-4 py-2 rounded-lg hover:bg-opacity-90 transition shadow-sm active:scale-95">
                  Add
                </button>
            </form>

            <div className="bg-slate-50 p-4 rounded-lg min-h-[80px] flex items-center justify-center text-center">
                <p className="text-sm text-dark-text italic">"{motivationalMessage}"</p>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-dark-text mb-2">Progress</h3>
              <WeightGraph history={user.weightHistory} goalWeight={user.goalWeight} />
            </div>

            {otherUserCurrentWeight && (
                <div className="text-center text-sm text-light-text border-t pt-4 mt-2">
                    <p>{otherUser.name}'s current weight: <span className="font-semibold">{otherUserCurrentWeight.toFixed(1)}kg</span></p>
                </div>
            )}
        </div>
        {isHistoryVisible && <WeightHistoryModal user={user} onClose={() => setIsHistoryVisible(false)} onDelete={handleDeleteWeight} />}
        {isEditModalVisible && <EditUserModal user={user} onClose={() => setIsEditModalVisible(false)} onSave={handleSaveDetails} />}
      </>
    );
}

const App: React.FC = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const loadData = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const usersData = await dataService.getUsers();
            setUsers(usersData);
        } catch (err: any) {
            console.error(err);
            setError(err.message || "Failed to load data from Firebase.");
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        const initialize = async () => {
            try {
                await dataService.initFirebaseAndSeed();
                await loadData();
            } catch (err: any) {
                console.error("Initialization Error:", err);
                setError(err.message || 'An unknown error occurred during initialization.');
                setIsLoading(false);
            }
        };
        initialize();
    }, [loadData]);

    const handleAddWeight = useCallback(async (userId: 'hussein' | 'rola', weight: number) => {
        await dataService.addWeightEntry(userId, weight);
        await loadData();
    }, [loadData]);

    const handleUpdateDetails = useCallback(async (userId: 'hussein' | 'rola', newGoalWeight: number) => {
        await dataService.updateUserGoalWeight(userId, newGoalWeight);
        await loadData();
    }, [loadData]);

    const handleDeleteWeight = useCallback(async (userId: 'hussein' | 'rola', idToDelete: string) => {
        await dataService.deleteWeightEntry(userId, idToDelete);
        await loadData();
    }, [loadData]);

    if (error) {
        return (
            <div className="flex items-center justify-center min-h-screen p-4 bg-light-bg">
                <div className="text-left bg-white border border-red-200 rounded-lg p-8 max-w-2xl shadow-lg">
                    <h2 className="text-2xl font-bold text-red-700">Firebase Firestore Permissions Error</h2>
                    <p className="mt-3 text-dark-text">
                        It looks like the app doesn't have permission to access your Firestore database. This is a common setup step!
                    </p>
                    <p className="mt-2 text-dark-text">
                        The error message from Firebase was: <code className="text-sm bg-red-50 text-red-700 rounded px-1 py-0.5">{error}</code>
                    </p>
                    
                    <p className="mt-6 font-semibold text-dark-text">To fix this, you need to update your Firestore Security Rules:</p>
                    
                    <ol className="list-decimal list-inside mt-3 space-y-2 text-light-text">
                        <li>Go to the <a href={`https://console.firebase.google.com/project/${firebaseConfig.projectId}/firestore/rules`} target="_blank" rel="noopener noreferrer" className="text-brand-primary hover:underline font-semibold">Firebase Console</a> for your project.</li>
                        <li>Navigate to the <strong>Firestore Database</strong> section.</li>
                        <li>Click on the <strong>Rules</strong> tab at the top.</li>
                        <li>Replace the existing rules with the following code. This will allow the app to read and write data.</li>
                    </ol>
                    
                    <pre className="bg-slate-800 text-white p-4 rounded-lg mt-4 text-sm overflow-x-auto">
                        <code>
{`rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // This rule allows anyone to read and write to your database.
    // It's great for getting started, but for production apps,
    // you should implement more secure rules.
    match /{document=**} {
      allow read, write: if true;
    }
  }
}`}
                        </code>
                    </pre>
                    
                    <p className="mt-4 text-sm text-light-text">
                        After pasting the new rules, click <strong>Publish</strong>. Then, refresh this page.
                    </p>
                </div>
            </div>
        );
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <p className="text-lg font-semibold text-brand-primary">Fetching your journey...</p>
                </div>
            </div>
        );
    }

    const hussein = users.find(u => u.id === 'hussein');
    const rola = users.find(u => u.id === 'rola');

    return (
        <div className="min-h-screen bg-light-bg text-dark-text font-sans p-4 sm:p-6 lg:p-8">
            <div className="max-w-7xl mx-auto">
                <header className="text-center mb-8 md:mb-12 relative">
                    <div className="flex items-center justify-center gap-3">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-brand-primary" viewBox="0 0 24 24" fill="currentColor">
                           <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                        </svg>
                        <h1 className="text-3xl md:text-4xl font-bold text-dark-text tracking-tight">
                          Our Weight Journey
                        </h1>
                    </div>
                    <p className="mt-2 text-light-text">Tracking our progress, one day at a time.</p>
                </header>

                <main>
                    {(!hussein || !rola) ? (
                        <div className="text-center text-red-500">Error: Could not load user data. Check your Firestore database.</div>
                    ) : (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                            <UserCard user={rola} otherUser={hussein} onAddWeight={handleAddWeight} onUpdateDetails={handleUpdateDetails} onDeleteWeight={handleDeleteWeight} />
                            <UserCard user={hussein} otherUser={rola} onAddWeight={handleAddWeight} onUpdateDetails={handleUpdateDetails} onDeleteWeight={handleDeleteWeight} />
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
};

export default App;
