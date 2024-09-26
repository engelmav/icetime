'use client';

import { useI18n } from '@/libs/locales/client';
import { Badge } from '@/libs/ui/badge';
import { Card, CardDescription, CardHeader, CardTitle } from '@/libs/ui/card';
import { useState, useEffect } from 'react';
import { getReadableIceTimeType } from '@/libs/utils';

export function LandingPageFeatures() {
    const t = useI18n();
    const [filteredIceData, setFilteredIceData] = useState([]);
    const [clinic, setClinic] = useState(false);
    const [openSkate, setOpenSkate] = useState(false);
    const [stickTime, setStickTime] = useState(false);
    const [openHockey, setOpenHockey] = useState(false);
    const [substituteRequest, setSubstituteRequest] = useState(false);

    useEffect(() => {
        async function fetchIceData() {
            const params = new URLSearchParams({
                clinic: clinic.toString(),
                openSkate: openSkate.toString(),
                stickTime: stickTime.toString(),
                openHockey: openHockey.toString(),
                substituteRequest: substituteRequest.toString(),
            });

            try {
                const response = await fetch(`/api/ice-data?${params.toString()}`);
                if (!response.ok) {
                    throw new Error('Failed to fetch ice data');
                }
                const data = await response.json();
                setFilteredIceData(data);
            } catch (error) {
                console.error('Error fetching ice data:', error);
                // Handle error (e.g., show error message to user)
            }
        }

        fetchIceData();
    }, [clinic, openSkate, stickTime, openHockey, substituteRequest]);

    const content = [
        {
            title: 'Real-time Ice Availability',
            description: 'Get up-to-the-minute information on ice time slots across various rinks.',
        },
        {
            title: 'Quick Booking',
            description: 'Reserve your ice time with just a few clicks, anytime, anywhere.',
        },
        {
            title: 'Diverse Ice Activities',
            description: 'Choose from clinics, open skates, stick time, and open hockey sessions.',
        },
        {
            title: 'Substitute Requests',
            description: 'Easily find or offer substitute spots for team practices or games.',
        },
        {
            title: 'Personalized Notifications',
            description: 'Get alerts for new ice times that match your preferences.',
        },
        {
            title: 'Multi-Rink Support',
            description: 'Access ice time information from multiple rinks in your area.',
        },
    ];

    return (
        <div
            id="landing-features"
            className="w-full max-w-5xl text-left mx-auto flex flex-col justify-center p-8 gap-8"
        >
            <h1 className="relative w-fit">
                <img
                    src="/images/brix/Line 1.svg"
                    alt="Image"
                    className="w-full scale-y-75 max-w-none absolute top-full left-0"
                />
                IceTime Features
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl">
                IceTime: Your quick way to get on the ice as much as possible. Discover available ice times, book sessions, and never miss a chance to skate.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
                {content.map((item, index) => (
                    <Card key={index}>
                        <CardHeader>
                            <CardTitle>{item.title}</CardTitle>
                            <CardDescription>{item.description}</CardDescription>
                        </CardHeader>
                    </Card>
                ))}
                <div className="col-span-1">
                    <label className="flex items-center">
                        <input 
                            type="checkbox" 
                            className="mr-2" 
                            checked={clinic}
                            onChange={(e) => setClinic(e.target.checked)}
                        />
                        Clinic
                    </label>
                </div>
                <div className="col-span-1">
                    <label className="flex items-center">
                        <input 
                            type="checkbox" 
                            className="mr-2" 
                            checked={openSkate}
                            onChange={(e) => setOpenSkate(e.target.checked)}
                        />
                        Open Skate
                    </label>
                </div>
                <div className="col-span-1">
                    <label className="flex items-center">
                        <input 
                            type="checkbox" 
                            className="mr-2" 
                            checked={stickTime}
                            onChange={(e) => setStickTime(e.target.checked)}
                        />
                        Stick Time
                    </label>
                </div>
                <div className="col-span-1">
                    <label className="flex items-center">
                        <input 
                            type="checkbox" 
                            className="mr-2" 
                            checked={openHockey}
                            onChange={(e) => setOpenHockey(e.target.checked)}
                        />
                        Open Hockey
                    </label>
                </div>
                <div className="col-span-1">
                    <label className="flex items-center">
                        <input 
                            type="checkbox" 
                            className="mr-2" 
                            checked={substituteRequest}
                            onChange={(e) => setSubstituteRequest(e.target.checked)}
                        />
                        Substitute Request
                    </label>
                </div>
                <div className="col-span-3">
                    <div className="grid grid-cols-5 gap-4 font-bold mb-2">
                        <div>Ice Type</div>
                        <div>Date</div>
                        <div>Time</div>
                        <div>Rink</div>
                        <div>Location</div>
                    </div>
                    {filteredIceData.map((item, index) => (
                        <div key={index} className="grid grid-cols-5 gap-4 py-2 border-b">
                            <div>{getReadableIceTimeType(item.iceType)}</div>
                            <div>{item.date}</div>
                            <div>{item.time}</div>
                            <div>{item.rink}</div>
                            <div>{item.location}</div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
