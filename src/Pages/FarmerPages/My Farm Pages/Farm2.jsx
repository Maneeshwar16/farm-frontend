
import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import LogoutButton from '../../LogoutButton';

const Farm2 = () => {
    const location = useLocation();
    const user = location.state?.user;

    const [farmName, setFarmName] = useState('');
    const [farmLocation, setFarmLocation] = useState('');
    const [area, setArea] = useState('');
    const [areaUnit, setAreaUnit] = useState('Acres');
    const [soilType, setSoilType] = useState('');
    const [irrigationMethod, setIrrigationMethod] = useState('');
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);

    async function saveFarm(e) {
        e.preventDefault();
        setMessage('');
        setLoading(true);

        const farm = {
            farmName,
            location: farmLocation,
            area: Number(area),
            areaUnit,
            soilType,
            irrigationMethod,
            farmerId: 1
        };

        try {
            const response = await fetch(import.meta.env.VITE_API_URL + '/farms', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(farm)
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(errorText || 'Failed to save farm');
            }

            setMessage('Farm saved successfully! 🌱');

            setFarmName('');
            setFarmLocation('');
            setArea('');
            setAreaUnit('Acres');
            setSoilType('');
            setIrrigationMethod('');
        } catch (error) {
            setMessage(error.message || 'Could not save farm.');
        } finally {
            setLoading(false);
        }
    }

    return (
        <div>
            <div id="logouths">
                <LogoutButton />
            </div>

            <h1>Heyy {user?.name}</h1>
            <h1>Your Farm Details 🌾</h1>

            <form onSubmit={saveFarm}>
                <div>
                    <label>Farm Name</label><br />
                    <input
                        type="text"
                        placeholder="Enter farm name"
                        value={farmName}
                        onChange={(e) => setFarmName(e.target.value)}
                        required
                    />
                </div>

                <br />

                <div>
                    <label>Farm Location</label><br />
                    <input
                        type="text"
                        placeholder="Enter farm location"
                        value={farmLocation}
                        onChange={(e) => setFarmLocation(e.target.value)}
                        required
                    />
                </div>

                <br />

                <div>
                    <label>Land Area</label><br />
                    <input
                        type="number"
                        placeholder="Enter land area"
                        value={area}
                        onChange={(e) => setArea(e.target.value)}
                        min="0.01"
                        step="0.01"
                        required
                    />
                </div>

                <br />

                <div>
                    <label>Area Unit</label><br />
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
                    <label>Soil Type</label><br />
                    <select
                        value={soilType}
                        onChange={(e) => setSoilType(e.target.value)}
                        required
                    >
                        <option value="">Select soil type</option>
                        <option value="Red Soil">Red Soil</option>
                        <option value="Black Soil">Black Soil</option>
                        <option value="Alluvial Soil">Alluvial Soil</option>
                        <option value="Sandy Soil">Sandy Soil</option>
                        <option value="Clay Soil">Clay Soil</option>
                        <option value="Other">Other</option>
                    </select>
                </div>

                <br />

                <div>
                    <label>Irrigation Method</label><br />
                    <select
                        value={irrigationMethod}
                        onChange={(e) => setIrrigationMethod(e.target.value)}
                        required
                    >
                        <option value="">Select irrigation method</option>
                        <option value="Drip Irrigation">Drip Irrigation</option>
                        <option value="Sprinkler Irrigation">
                            Sprinkler Irrigation
                        </option>
                        <option value="Flood Irrigation">Flood Irrigation</option>
                        <option value="Rainfed">Rainfed</option>
                    </select>
                </div>

                <br />

                <button type="submit" disabled={loading}>
                    {loading ? 'Saving...' : 'Save Farm'}
                </button>
            </form>

            {message && <p>{message}</p>}
        </div>
    );
};

export default Farm2;
