
import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import LogoutButton from '../../LogoutButton';

const cropStages = [
    { value: 'Land Preparation', meaning: 'Land is being cleared and prepared for planting.' },
    { value: 'Seeded / Planted', meaning: 'Seeds or seedlings have been planted in the soil.' },
    { value: 'Pre-Emergence', meaning: 'Seeds are germinating underground; shoots have not appeared.' },
    { value: 'Emergence / Sprouting', meaning: 'The first shoots are appearing above the soil.' },
    { value: 'Vegetative Stage', meaning: 'Roots, stems and leaves are developing.' },
    { value: 'Flowering / Reproductive Stage', meaning: 'The crop is producing flowers, pods or grain heads.' },
    { value: 'Maturation / Ripening', meaning: 'The crop is maturing and approaching harvest.' }
];

const API = import.meta.env.VITE_API_URL + '';

const emptyCrop = {
    cropName: '',
    variety: '',
    plantingDate: '',
    area: '',
    areaUnit: 'Acres',
    seedSource: '',
    fertilizerUsed: '',
    expectedHarvestDate: '',
    cropStatus: 'Seeded / Planted'
};

const Crop1 = () => {
    const location = useLocation();
    const user = location.state?.user;

    const [form, setForm] = useState(emptyCrop);
    const [crops, setCrops] = useState([]);
    const [editingId, setEditingId] = useState(null);
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);

    // Load the logged-in farmer's existing crops
    useEffect(() => {
        if (!user?.id) return;

        async function loadCrops() {
            try {
                const response = await fetch(
                    `${API}/crops/farmer/${user.id}`
                );

                if (!response.ok) {
                    throw new Error('Could not load your crops.');
                }

                const data = await response.json();
                setCrops(Array.isArray(data) ? data : []);
            } catch (error) {
                setMessage(error.message);
            }
        }

        loadCrops();
    }, [user?.id]);

    function handleChange(e) {
        const { name, value } = e.target;

        setForm(previous => ({
            ...previous,
            [name]: value
        }));
    }

    function editCrop(crop) {
        setEditingId(crop.id);

        setForm({
            cropName: crop.cropName ?? '',
            variety: crop.variety ?? '',
            plantingDate: crop.plantingDate ?? '',
            area: crop.area ?? '',
            areaUnit: crop.areaUnit ?? 'Acres',
            seedSource: crop.seedSource ?? '',
            fertilizerUsed: crop.fertilizerUsed ?? '',
            expectedHarvestDate: crop.expectedHarvestDate ?? '',
            cropStatus: crop.cropStatus ?? 'Seeded / Planted'
        });

        setMessage('');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    function cancelEdit() {
        setEditingId(null);
        setForm(emptyCrop);
        setMessage('');
    }

    async function saveCrop(e) {
        e.preventDefault();
        setMessage('');

        if (!user?.id) {
            setMessage('Please log in again to save your crop.');
            return;
        }

        setLoading(true);

        const crop = {
            ...form,
            area: Number(form.area),
            farmerId: user.id
        };

        try {
            const url = editingId
                ? `${API}/crops/${editingId}`
                : `${API}/crops`;

            const response = await fetch(url, {
                method: editingId ? 'PUT' : 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(crop)
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(errorText || 'Failed to save crop.');
            }

            const savedCrop = await response.json().catch(() => null);

            if (editingId) {
                setCrops(previous =>
                    previous.map(item =>
                        item.id === editingId
                            ? { ...item, ...crop, ...(savedCrop || {}) }
                            : item
                    )
                );

                setMessage('Crop details updated successfully! 🌱');
            } else {
                if (savedCrop) {
                    setCrops(previous => [...previous, savedCrop]);
                } else {
                    // Refresh the list when the API doesn't return the saved crop
                    const refresh = await fetch(
                        `${API}/crops/farmer/${user.id}`
                    );
                    if (refresh.ok) {
                        const data = await refresh.json();
                        setCrops(Array.isArray(data) ? data : []);
                    }
                }

                setMessage('Current crop saved successfully! 🌱');
            }

            setEditingId(null);
            setForm(emptyCrop);
        } catch (error) {
            setMessage(error.message || 'Could not save crop. Check your backend.');
        } finally {
            setLoading(false);
        }
    }

    const selectedStage = cropStages.find(
        stage => stage.value === form.cropStatus
    );

    return (
        <div className="crop-page">
            <div id="logouths">
                <LogoutButton />
            </div>

            <h1>Hey {user?.name || 'Farmer'}!</h1>
            <h1>Current Crop Details 🌱</h1>

            <form onSubmit={saveCrop}>
                <div>
                    <label>Crop Name</label><br />
                    <input
                        name="cropName"
                        type="text"
                        placeholder="e.g. Tomato, Rice, Chilli"
                        value={form.cropName}
                        onChange={handleChange}
                        required
                    />
                </div><br />

                <div>
                    <label>Crop Variety</label><br />
                    <input
                        name="variety"
                        type="text"
                        placeholder="Enter crop variety"
                        value={form.variety}
                        onChange={handleChange}
                        required
                    />
                </div><br />

                <div>
                    <label>Planting Date</label><br />
                    <input
                        name="plantingDate"
                        type="date"
                        value={form.plantingDate}
                        onChange={handleChange}
                        required
                    />
                </div><br />

                <div>
                    <label>Cultivated Area</label><br />
                    <input
                        name="area"
                        type="number"
                        min="0.01"
                        step="0.01"
                        placeholder="Enter area used"
                        value={form.area}
                        onChange={handleChange}
                        required
                    />
                </div><br />

                <div>
                    <label>Area Unit</label><br />
                    <select
                        name="areaUnit"
                        value={form.areaUnit}
                        onChange={handleChange}
                    >
                        <option value="Acres">Acres</option>
                        <option value="Hectares">Hectares</option>
                        <option value="Cents">Cents</option>
                    </select>
                </div><br />

                <div>
                    <label>Seed Source / Company</label><br />
                    <input
                        name="seedSource"
                        type="text"
                        placeholder="Enter seed supplier or company"
                        value={form.seedSource}
                        onChange={handleChange}
                        required
                    />
                </div><br />

                <div>
                    <label>Fertilizer Used</label><br />
                    <input
                        name="fertilizerUsed"
                        type="text"
                        placeholder="Enter fertilizer name or type"
                        value={form.fertilizerUsed}
                        onChange={handleChange}
                        required
                    />
                </div><br />

                <div>
                    <label>Expected Harvest Date</label><br />
                    <input
                        name="expectedHarvestDate"
                        type="date"
                        min={form.plantingDate || undefined}
                        value={form.expectedHarvestDate}
                        onChange={handleChange}
                        required
                    />
                </div><br />

                <div>
                    <label>Current Crop Stage</label><br />
                    <select
                        name="cropStatus"
                        value={form.cropStatus}
                        onChange={handleChange}
                        required
                    >
                        {cropStages.map(stage => (
                            <option key={stage.value} value={stage.value}>
                                {stage.value}
                            </option>
                        ))}
                    </select>

                    {selectedStage && <p>{selectedStage.meaning}</p>}
                </div><br />

                <button type="submit" disabled={loading}>
                    {loading
                        ? 'Saving...'
                        : editingId
                            ? 'Save Changes'
                            : 'Save Current Crop'}
                </button>

                {editingId && (
                    <button
                        type="button"
                        onClick={cancelEdit}
                        disabled={loading}
                    >
                        Cancel Edit
                    </button>
                )}
            </form>

            {message && <p role="status">{message}</p>}

            <hr />

            <h2>Your Current Crops</h2>

            {crops.length === 0 ? (
                <p>No crops added yet.</p>
            ) : (
                crops.map(crop => (
                    <div key={crop.id} className="crop-record">
                        <h3>{crop.cropName}</h3>
                        <p>Variety: {crop.variety}</p>
                        <p>Area: {crop.area} {crop.areaUnit}</p>
                        <p>Stage: {crop.cropStatus}</p>
                        <p>Expected Harvest: {crop.expectedHarvestDate}</p>

                        <button
                            type="button"
                            onClick={() => editCrop(crop)}
                        >
                            Edit Crop Details
                        </button>
                    </div>
                ))
            )}
        </div>
    );
};

export default Crop1;
