import React, { useState } from 'react';
import { initialNutritionistProfile, type NutritionistProfile } from './types';

interface Props {
    onComplete: () => void;
}

export const NutritionistOnboarding: React.FC<Props> = ({ onComplete }) => {
    const [step, setStep] = useState(1);
    const [profile, setProfile] = useState<NutritionistProfile>(initialNutritionistProfile);
    const [isSaving, setIsSaving] = useState(false);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const res = await fetch('/api/nutritionist/profile', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(profile),
            });
            if (res.ok) {
                onComplete();
            }
        } catch (err) {
            console.error(err);
        } finally {
            setIsSaving(false);
        }
    };

    const renderStep1_Goals = () => (
        <div className="space-y-4">
            <h2 className="text-xl font-bold">What is your primary nutrition goal?</h2>
            <div className="grid gap-2">
                {['fat_loss', 'muscle_gain', 'recomposition', 'performance', 'general_health'].map((g) => (
                    <button
                        key={g}
                        onClick={() => setProfile({ ...profile, goals: { ...profile.goals, primary: g as any } })}
                        className={`p-4 rounded border ${profile.goals.primary === g ? 'bg-blue-100 border-blue-500' : 'border-gray-200'}`}
                    >
                        {g.replace('_', ' ').toUpperCase()}
                    </button>
                ))}
            </div>
            <button onClick={() => setStep(2)} className="w-full py-2 bg-black text-white rounded">Next</button>
        </div>
    );

    const renderStep2_DoctorFocus = () => (
        <div className="space-y-4">
            <h2 className="text-xl font-bold">Has a doctor asked you to focus on any of these?</h2>
            <p className="text-sm text-gray-500">We use this to adjust your plan's structure, not to treat conditions.</p>
            <div className="space-y-2">
                {[
                    { key: 'bloodSugar', label: 'Watch Blood Sugar / Carbs' },
                    { key: 'bloodPressure', label: 'Watch Blood Pressure / Salt' },
                    { key: 'cholesterolOrFats', label: 'Watch Cholesterol / Fats' },
                    { key: 'digestion', label: 'Digestive Comfort' },
                ].map(({ key, label }) => (
                    <label key={key} className="flex items-center space-x-2 p-2 border rounded">
                        <input
                            type="checkbox"
                            checked={(profile.doctorFocusAreas as any)[key] || false}
                            onChange={(e) => setProfile({
                                ...profile,
                                doctorFocusAreas: { ...profile.doctorFocusAreas, [key]: e.target.checked }
                            })}
                        />
                        <span>{label}</span>
                    </label>
                ))}
            </div>
            <div className="flex justify-between">
                <button onClick={() => setStep(1)} className="text-gray-500">Back</button>
                <button onClick={() => setStep(3)} className="px-4 py-2 bg-black text-white rounded">Next</button>
            </div>
        </div>
    );

    const renderStep3_MedsAndGI = () => (
        <div className="space-y-4">
            <h2 className="text-xl font-bold">Medications & Comfort</h2>
            <p className="text-sm text-gray-500">Do you take any meds that affect appetite or digestion?</p>
            <div className="space-y-2">
                <label className="flex items-center space-x-2">
                    <input
                        type="checkbox"
                        checked={profile.meds.glp1OrSimilar || false}
                        onChange={(e) => setProfile({ ...profile, meds: { ...profile.meds, glp1OrSimilar: e.target.checked } })}
                    />
                    <span>GLP-1 Agonist (Ozempic, Wegovy, etc.)</span>
                </label>
                <label className="flex items-center space-x-2">
                    <input
                        type="checkbox"
                        checked={profile.meds.metformin || false}
                        onChange={(e) => setProfile({ ...profile, meds: { ...profile.meds, metformin: e.target.checked } })}
                    />
                    <span>Metformin</span>
                </label>
            </div>

            <h3 className="font-semibold mt-4">Digestive Sensitivities</h3>
            <div className="space-y-2">
                <label className="flex items-center space-x-2">
                    <input
                        type="checkbox"
                        checked={profile.giAndTolerance.proneToNausea || false}
                        onChange={(e) => setProfile({ ...profile, giAndTolerance: { ...profile.giAndTolerance, proneToNausea: e.target.checked } })}
                    />
                    <span>Prone to Nausea</span>
                </label>
                <label className="flex items-center space-x-2">
                    <input
                        type="checkbox"
                        checked={profile.giAndTolerance.dairyIssues || false}
                        onChange={(e) => setProfile({ ...profile, giAndTolerance: { ...profile.giAndTolerance, dairyIssues: e.target.checked } })}
                    />
                    <span>Dairy Sensitivity</span>
                </label>
            </div>

            <div className="flex justify-between mt-4">
                <button onClick={() => setStep(2)} className="text-gray-500">Back</button>
                <button onClick={handleSave} disabled={isSaving} className="px-4 py-2 bg-green-600 text-white rounded">
                    {isSaving ? 'Saving...' : 'Finish Setup'}
                </button>
            </div>
        </div>
    );

    return (
        <div className="max-w-md mx-auto p-6 bg-white rounded-xl shadow-sm border">
            {step === 1 && renderStep1_Goals()}
            {step === 2 && renderStep2_DoctorFocus()}
            {step === 3 && renderStep3_MedsAndGI()}
        </div>
    );
};
