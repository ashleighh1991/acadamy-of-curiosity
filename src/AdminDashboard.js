import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, X } from 'lucide-react';
import { collection, addDoc, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../src/services/firebase';

export default function AdminDashboard() {
  const [challenges, setChallenges] = useState([]);
  const [showNewChallenge, setShowNewChallenge] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    category: '',
    description: '',
    duration: '',
    difficulty: 'Beginner',
    price: 0,
    participants: 0,
    startDate: '',
    tasks: [''],
    weeks: [{ week: 1, title: '', prompt: '', dueDate: '', essays: 0 }]
  });

  // Load challenges from Firestore on mount
  useEffect(() => {
    const loadChallenges = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'challenges'));
        const loadedChallenges = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setChallenges(loadedChallenges);
      } catch (error) {
        console.error('Error loading challenges:', error);
      }
    };
    loadChallenges();
  }, []);

  const handleAddChallenge = async () => {
    if (!formData.title || !formData.category) {
      alert('Title and category are required');
      return;
    }

    try {
      // Save to Firestore
      const docRef = await addDoc(collection(db, 'challenges'), {
        title: formData.title,
        category: formData.category,
        description: formData.description,
        duration: formData.duration,
        difficulty: formData.difficulty,
        price: formData.price,
        participants: formData.participants,
        startDate: formData.startDate,
        tasks: formData.tasks.filter(t => t),
        weeks: formData.weeks,
        createdAt: new Date().toISOString(),
      });

      // Add to local state with the new ID
      const newChallenge = {
        id: docRef.id,
        ...formData,
        tasks: formData.tasks.filter(t => t),
      };

      setChallenges([...challenges, newChallenge]);
      
      // Reset form
      setFormData({
        title: '',
        category: '',
        description: '',
        duration: '',
        difficulty: 'Beginner',
        price: 0,
        participants: 0,
        startDate: '',
        tasks: [''],
        weeks: [{ week: 1, title: '', prompt: '', dueDate: '', essays: 0 }]
      });
      
      setShowNewChallenge(false);
      alert('✅ Challenge created and saved to database!');
    } catch (error) {
      alert(`❌ Error saving challenge: ${error.message}`);
      console.error(error);
    }
  };

  const handleDeleteChallenge = async (id) => {
    try {
      // Delete from Firestore
      await deleteDoc(doc(db, 'challenges', id));
      // Remove from local state
      setChallenges(challenges.filter(c => c.id !== id));
      alert('✅ Challenge deleted!');
    } catch (error) {
      alert(`❌ Error deleting challenge: ${error.message}`);
      console.error(error);
    }
  };

  const handleAddTask = () => {
    setFormData({
      ...formData,
      tasks: [...formData.tasks, '']
    });
  };

  const handleAddWeek = () => {
    const newWeek = {
      week: formData.weeks.length + 1,
      title: '',
      prompt: '',
      dueDate: '',
      essays: 0
    };
    setFormData({
      ...formData,
      weeks: [...formData.weeks, newWeek]
    });
  };

  const handleUpdateTask = (index, value) => {
    const newTasks = [...formData.tasks];
    newTasks[index] = value;
    setFormData({ ...formData, tasks: newTasks });
  };

  const handleUpdateWeek = (index, field, value) => {
    const newWeeks = [...formData.weeks];
    newWeeks[index] = { ...newWeeks[index], [field]: value };
    setFormData({ ...formData, weeks: newWeeks });
  };


  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-4xl font-serif text-gray-900">Admin Dashboard</h1>
          <button
            onClick={() => setShowNewChallenge(!showNewChallenge)}
            className="px-6 py-2 bg-gray-900 text-white rounded-full hover:bg-gray-800 flex items-center space-x-2"
          >
            <Plus className="w-5 h-5" />
            <span>New Challenge</span>
          </button>
        </div>

        {/* New/Edit Challenge Form */}
        {showNewChallenge && (
          <div className="bg-white rounded-lg p-8 mb-8 border border-gray-200">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-serif text-gray-900">Create Challenge</h2>
              <button onClick={() => setShowNewChallenge(false)}>
                <X className="w-6 h-6 text-gray-400" />
              </button>
            </div>

            <div className="space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-gray-900"
                    placeholder="e.g., Philosophy 101"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                  <input
                    type="text"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-gray-900"
                    placeholder="e.g., Philosophy"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Duration</label>
                  <input
                    type="text"
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-gray-900"
                    placeholder="e.g., 4 weeks"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
                  <input
                    type="text"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-gray-900"
                    placeholder="e.g., Dec 1, 2025"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Difficulty</label>
                  <select
                    value={formData.difficulty}
                    onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-gray-900"
                  >
                    <option>Beginner</option>
                    <option>Intermediate</option>
                    <option>Advanced</option>
                    <option>All Levels</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Price ($)</label>
                  <input
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-gray-900"
                    placeholder="0"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-gray-900"
                  placeholder="Describe the challenge..."
                  rows="3"
                />
              </div>

              {/* Tasks */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-sm font-medium text-gray-700">Tasks</label>
                  <button
                    onClick={handleAddTask}
                    className="text-sm text-blue-600 hover:text-blue-700"
                  >
                    + Add Task
                  </button>
                </div>
                <div className="space-y-2">
                  {formData.tasks.map((task, idx) => (
                    <input
                      key={idx}
                      type="text"
                      value={task}
                      onChange={(e) => handleUpdateTask(idx, e.target.value)}
                      className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-gray-900"
                      placeholder="e.g., Weekly essay (800 words)"
                    />
                  ))}
                </div>
              </div>

              {/* Weeks */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-sm font-medium text-gray-700">Weekly Schedule</label>
                  <button
                    onClick={handleAddWeek}
                    className="text-sm text-blue-600 hover:text-blue-700"
                  >
                    + Add Week
                  </button>
                </div>
                <div className="space-y-4">
                  {formData.weeks.map((week, idx) => (
                    <div key={idx} className="border border-gray-200 rounded-lg p-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Week Title</label>
                          <input
                            type="text"
                            value={week.title}
                            onChange={(e) => handleUpdateWeek(idx, 'title', e.target.value)}
                            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-gray-900"
                            placeholder="e.g., Introduction"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
                          <input
                            type="text"
                            value={week.dueDate}
                            onChange={(e) => handleUpdateWeek(idx, 'dueDate', e.target.value)}
                            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-gray-900"
                            placeholder="e.g., Dec 8"
                          />
                        </div>
                      </div>
                      <div className="mt-3">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Prompt</label>
                        <textarea
                          value={week.prompt}
                          onChange={(e) => handleUpdateWeek(idx, 'prompt', e.target.value)}
                          className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-gray-900"
                          placeholder="Write the week's prompt here..."
                          rows="2"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center space-x-4 pt-4">
                <button
                  onClick={handleAddChallenge}
                  className="px-6 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800"
                >
                  Create Challenge
                </button>
                <button
                  onClick={() => setShowNewChallenge(false)}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Challenges List */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="px-8 py-6 border-b border-gray-200">
            <h2 className="text-xl font-serif text-gray-900">Created Challenges ({challenges.length})</h2>
          </div>

          {challenges.length === 0 ? (
            <div className="px-8 py-12 text-center text-gray-500">
              <p>No challenges created yet. Create one to get started!</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {challenges.map((challenge) => (
                <div key={challenge.id} className="px-8 py-6 hover:bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-medium text-gray-900 mb-2">{challenge.title}</h3>
                      <p className="text-sm text-gray-600 mb-3">{challenge.description}</p>
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <span>{challenge.category}</span>
                        <span>•</span>
                        <span>{challenge.duration}</span>
                        <span>•</span>
                        <span>${challenge.price}</span>
                        <span>•</span>
                        <span>{challenge.weeks.length} weeks</span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteChallenge(challenge.id)}
                      className="text-red-600 hover:text-red-700 ml-4"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="mt-12 bg-green-50 border border-green-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-green-900 mb-3">✅ How to Use</h3>
          <ol className="text-sm text-green-800 space-y-2">
            <li>1. Click "New Challenge" to create a challenge</li>
            <li>2. Fill in all the details (title, description, weeks, prompts)</li>
            <li>3. Click "Create Challenge" to save</li>
            <li>4. ✨ That's it! Challenges auto-save to Firestore</li>
            <li>5. Go to main app - new challenges appear automatically!</li>
            <li>6. No manual copying or restarting needed 🎉</li>
          </ol>
        </div>
      </div>
    </div>
  );
}