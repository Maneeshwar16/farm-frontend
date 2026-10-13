import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import LogoutButton from '../../LogoutButton';

const cropStages = [
    {
        value: 'Land Preparation',
        meaning: 'Land is being cleared and prepared for planting.'
    },
    {
        value: 'Seeded / Planted',
        meaning: 'Seeds or seedlings have been planted in the soil.'
    },
    {
        value: 'Pre-Emergence',
        meaning: 'Seeds are germinating underground; shoots have not appeared.'
    },
    {
        value: 'Emergence / Sprouting',
        meaning: 'The first shoots are appearing above the soil.'
    },
    {
        value: 'Vegetative Stage',
        meaning: 'Roots, stems and leaves are developing.'
    },
    {
        value: 'Flowering / Reproductive Stage',
        meaning: 'The crop is producing flowers, pods or grain heads.'
    },
    {
        value: 'Maturation / Ripening',
        meaning: 'The crop is maturing and approaching harvest.'
    }
];

const Crop2 = () => {
    const location = useLocation();
    const user = location.state?.user;

    const [cropName, setCropName] = useState('');
    const [variety, setVariety] = useState('');
    const [plantingDate, setPlantingDate] = useState('');
    const [area, setArea] = useState('');
    const [areaUnit, setAreaUnit] = useState('Acres');
    const [seedSource, setSeedSource] = useState('');
    const [fertilizerUsed, setFertilizerUsed] = useState('');
    const [expectedHarvestDate, setExpectedHarvestDate] = useState('');
    const [cropStatus, setCropStatus] = useState('Seeded / Planted');

    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);

    async function saveCrop(e) {
        e.preventDefault();
        setMessage('');
        setLoading(true);

        const crop = {
            cropName,
            variety,
            plantingDate,
            area: Number(area),
            areaUnit,
            seedSource,
            fertilizerUsed,
            expectedHarvestDate,
            cropStatus,
            farmerId: 1 // Temporary until login is connected
        };

        try {
            const response = await fetch(import.meta.env.VITE_API_URL + '/crops', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(crop)
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(errorText || 'Failed to save crop');
            }

            setMessage('Current crop saved successfully! 🌱');

            setCropName('');
            setVariety('');
            setPlantingDate('');
            setArea('');
            setAreaUnit('Acres');
            setSeedSource('');
            setFertilizerUsed('');
            setExpectedHarvestDate('');
            setCropStatus('Seeded / Planted');

        } catch (error) {
            setMessage(
                error.message || 'Could not save crop. Check your backend.'
            );
        } finally {
            setLoading(false);
        }
    }

    const selectedStage = cropStages.find(
        (stage) => stage.value === cropStatus
    );

    return (
        <div>
            <div id="logouths">
                <LogoutButton />
            </div>

            <h1>Heyy {user?.name}</h1>
            <h1>Current Crop Details 🌱</h1>

            <form onSubmit={saveCrop}>
                <div>
                    <label>Crop Name</label>
                    <br />
                    <input
                        type="text"
                        placeholder="e.g. Tomato, Rice, Chilli"
                        value={cropName}
                        onChange={(e) => setCropName(e.target.value)}
                        required
                    />
                </div>

                <br />

                <div>
                    <label>Crop Variety</label>
                    <br />
                    <input
                        type="text"
                        placeholder="Enter crop variety"
                        value={variety}
                        onChange={(e) => setVariety(e.target.value)}
                        required
                    />
                </div>

                <br />

                <div>
                    <label>Planting Date</label>
                    <br />
                    <input
                        type="date"
                        value={plantingDate}
                        onChange={(e) => setPlantingDate(e.target.value)}
                        required
                    />
                </div>

                <br />

                <div>
                    <label>Cultivated Area</label>
                    <br />
                    <input
                        type="number"
                        min="0.01"
                        step="0.01"
                        placeholder="Enter area used"
                        value={area}
                        onChange={(e) => setArea(e.target.value)}
                        required
                    />
                </div>

                <br />

                <div>
                    <label>Area Unit</label>
                    <br />
                    <select
                        value={areaUnit}
                        onChange={(e) => setAreaUnit(e.target.value)}
                    >
                        <option value="Acres">Acres</option>
                        <option value="Hectares">Hectares</option>
                        <option value="Cents">Cents</option>
                    </select>
                </div>

                <br />

                <div>
                    <label>Seed Source / Company</label>
                    <br />
                    <input
                        type="text"
                        placeholder="Enter seed supplier or company"
                        value={seedSource}
                        onChange={(e) => setSeedSource(e.target.value)}
                        required
                    />
                </div>

                <br />

                <div>
                    <label>Fertilizer Used</label>
                    <br />
                    <input
                        type="text"
                        placeholder="Enter fertilizer name or type"
                        value={fertilizerUsed}
                        onChange={(e) => setFertilizerUsed(e.target.value)}
                        required
                    />
                </div>

                <br />

                <div>
                    <label>Expected Harvest Date</label>
                    <br />
                    <input
                        type="date"
                        value={expectedHarvestDate}
                        onChange={(e) =>
                            setExpectedHarvestDate(e.target.value)
                        }
                        min={plantingDate || undefined}
                        required
                    />
                </div>

                <br />

                <div>
                    <label>Current Crop Stage</label>
                    <br />

                    <select
                        value={cropStatus}
                        onChange={(e) => setCropStatus(e.target.value)}
                        required
                    >
                        {cropStages.map((stage) => (
                            <option
                                key={stage.value}
                                value={stage.value}
                            >
                                {stage.value}
                            </option>
                        ))}
                    </select>

                    {selectedStage && (
                        <p>{selectedStage.meaning}</p>
                    )}
                </div>

                <br />

                <button type="submit" disabled={loading}>
                    {loading ? 'Saving...' : 'Save Current Crop'}
                </button>
            </form>

            {message && <p>{message}</p>}
        </div>
    );
};

export default Crop2;
