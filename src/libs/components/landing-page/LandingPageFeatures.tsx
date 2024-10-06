'use client';

import { useI18n } from '@/libs/locales/client';
import { Badge } from '@/libs/ui/badge';
import { Card, CardDescription, CardHeader, CardTitle } from '@/libs/ui/card';
import { useState, useEffect, useCallback } from 'react';
import { getReadableIceTimeType } from '@/libs/utils';
import { useMediaQuery } from '@/libs/hooks/useMediaQuery'
import { Button } from '@/libs/ui/button';
import { FilterDialog } from './FilterDialog';
import { IceTimeTypeEnum } from '@prisma/client';
import { Input } from '@/libs/ui/input';

interface IceDataItem {
  type: IceTimeTypeEnum;
  originalIceType?: string;
  date: string;
  startTime: string;
  endTime: string;
  rink: {
    name: string;
    location: string;
    website: string | null;
    latitude: number;
    longitude: number;
  };
  distance?: number;
}

// TimeRangePicker component
function TimeRangePicker({ startTime, endTime, onTimeRangeChange }: {
    startTime: string;
    endTime: string;
    onTimeRangeChange: (startTime: string, endTime: string) => void;
}) {
    return (
        <div className="flex flex-col space-y-4">
            <div>
                <label htmlFor="startTime" className="block text-sm font-medium text-gray-700">Start Time</label>
                <Input
                    type="time"
                    id="startTime"
                    value={startTime}
                    onChange={(e) => onTimeRangeChange(e.target.value, endTime)}
                />
            </div>
            <div>
                <label htmlFor="endTime" className="block text-sm font-medium text-gray-700">End Time</label>
                <Input
                    type="time"
                    id="endTime"
                    value={endTime}
                    onChange={(e) => onTimeRangeChange(startTime, e.target.value)}
                />
            </div>
        </div>
    );
}

export function LandingPageFeatures() {
    const t = useI18n();
    const [filteredIceData, setFilteredIceData] = useState<IceDataItem[]>([]);
    const [userLocation, setUserLocation] = useState<{ lat: number; lon: number } | null>(null);
    const [openSkate, setOpenSkate] = useState(false);
    const [stickTime, setStickTime] = useState(false);
    const [openHockey, setOpenHockey] = useState(false);
    const [substituteRequest, setSubstituteRequest] = useState(false);
    const [learnToSkate, setLearnToSkate] = useState(false);
    const [youthClinic, setYouthClinic] = useState(false);
    const [adultClinic, setAdultClinic] = useState(false);
    const [other, setOther] = useState(false);
    const [dateFilter, setDateFilter] = useState('today');
    const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
    const isMobile = useMediaQuery('(max-width: 640px)');
    const [startTime, setStartTime] = useState('00:00');
    const [endTime, setEndTime] = useState('23:59');
    const [isTimeFilterApplied, setIsTimeFilterApplied] = useState(false);
    const [isIceTypeFilterOpen, setIsIceTypeFilterOpen] = useState(false);
    const [isTimeFilterOpen, setIsTimeFilterOpen] = useState(false);

    useEffect(() => {
        async function getUserLocation() {
            try {
                const response = await fetch('https://ipapi.co/json/');
                const data = await response.json();
                setUserLocation({ lat: data.latitude, lon: data.longitude });
            } catch (error) {
                console.error('Error fetching user location:', error);
            }
        }

        getUserLocation();
    }, []);

    const calculateDistance = useCallback((lat1: number, lon1: number, lat2: number, lon2: number) => {
        const R = 6371; // Radius of the Earth in km
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = 
            Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
            Math.sin(dLon/2) * Math.sin(dLon/2); 
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
        return R * c; // Distance in km
    }, []);

    useEffect(() => {
        if (userLocation) {
            setFilteredIceData(prevData => 
                prevData.map(item => ({
                    ...item,
                    distance: item.rink.latitude && item.rink.longitude
                        ? calculateDistance(
                            userLocation.lat,
                            userLocation.lon,
                            item.rink.latitude,
                            item.rink.longitude
                        )
                        : undefined
                }))
            );
        }
    }, [userLocation, calculateDistance]);

    useEffect(() => {
        async function fetchIceData() {
            const params = new URLSearchParams({
                openSkate: openSkate.toString(),
                stickTime: stickTime.toString(),
                openHockey: openHockey.toString(),
                substituteRequest: substituteRequest.toString(),
                learnToSkate: learnToSkate.toString(),
                youthClinic: youthClinic.toString(),
                adultClinic: adultClinic.toString(),
                other: other.toString(),
                dateFilter: dateFilter,
                startTime: startTime,
                endTime: endTime,
            });

            try {
                const response = await fetch(`/api/ice-data?${params.toString()}`);
                if (!response.ok) {
                    throw new Error('Failed to fetch ice data');
                }
                const data: IceDataItem[] = await response.json();
                setFilteredIceData(data);
            } catch (error) {
                console.error('Error fetching ice data:', error);
            }
        }

        fetchIceData();
    }, [openSkate, stickTime, openHockey, substituteRequest, learnToSkate, youthClinic, adultClinic, other, dateFilter, startTime, endTime]);

    const clearFilters = () => {
        setOpenSkate(false);
        setStickTime(false);
        setOpenHockey(false);
        setSubstituteRequest(false);
        setLearnToSkate(false);
        setYouthClinic(false);
        setAdultClinic(false);
        setOther(false);
        setDateFilter('today');
        setStartTime('00:00');
        setEndTime('23:59');
        setIsTimeFilterApplied(false);
    };

    const handleTimeRangeChange = (newStartTime: string, newEndTime: string) => {
        setStartTime(newStartTime);
        setEndTime(newEndTime);
        setIsTimeFilterApplied(true);
    };

    const clearTimeFilter = () => {
        setStartTime('00:00');
        setEndTime('23:59');
        setIsTimeFilterApplied(false);
    };

    const getTimeFilterButtonText = () => {
        if (isTimeFilterApplied) {
            return `${startTime} - ${endTime}`;
        }
        return 'Set time range';
    };

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

    const IceTypeFilters = () => (
        <>
            <label className="flex items-center">
                <input
                    type="checkbox"
                    className="mr-2"
                    checked={openSkate}
                    onChange={(e) => setOpenSkate(e.target.checked)}
                />
                Open Skate
            </label>
            <label className="flex items-center">
                <input
                    type="checkbox"
                    className="mr-2"
                    checked={stickTime}
                    onChange={(e) => setStickTime(e.target.checked)}
                />
                Stick Time
            </label>
            <label className="flex items-center">
                <input
                    type="checkbox"
                    className="mr-2"
                    checked={openHockey}
                    onChange={(e) => setOpenHockey(e.target.checked)}
                />
                Open Hockey
            </label>
            <label className="flex items-center">
                <input
                    type="checkbox"
                    className="mr-2"
                    checked={substituteRequest}
                    onChange={(e) => setSubstituteRequest(e.target.checked)}
                />
                Substitute Request
            </label>
            <label className="flex items-center">
                <input
                    type="checkbox"
                    className="mr-2"
                    checked={learnToSkate}
                    onChange={(e) => setLearnToSkate(e.target.checked)}
                />
                Learn to Skate
            </label>
            <label className="flex items-center">
                <input
                    type="checkbox"
                    className="mr-2"
                    checked={youthClinic}
                    onChange={(e) => setYouthClinic(e.target.checked)}
                />
                Youth Clinic
            </label>
            <label className="flex items-center">
                <input
                    type="checkbox"
                    className="mr-2"
                    checked={adultClinic}
                    onChange={(e) => setAdultClinic(e.target.checked)}
                />
                Adult Clinic
            </label>
            <label className="flex items-center">
                <input
                    type="checkbox"
                    className="mr-2"
                    checked={other}
                    onChange={(e) => setOther(e.target.checked)}
                />
                Other
            </label>
        </>
    );

    const TimeRangeFilter = () => (
        <TimeRangePicker
            startTime={startTime}
            endTime={endTime}
            onTimeRangeChange={handleTimeRangeChange}
        />
    );

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
            </div>
            <div className="w-full flex flex-col items-center sm:block">
                <div className="w-full sm:col-span-full mb-4">
                    <div className="flex flex-wrap justify-center gap-4">
                        <button
                            className={`px-4 py-2 rounded ${
                                dateFilter === 'today' 
                                ? 'bg-primary text-primary-foreground' 
                                : 'bg-secondary text-secondary-foreground'
                            }`}
                            onClick={() => setDateFilter('today')}
                        >
                            Today
                        </button>
                        <button
                            className={`px-4 py-2 rounded ${
                                dateFilter === 'tomorrow' 
                                ? 'bg-primary text-primary-foreground' 
                                : 'bg-secondary text-secondary-foreground'
                            }`}
                            onClick={() => setDateFilter('tomorrow')}
                        >
                            Tomorrow
                        </button>
                        <button
                            className={`px-4 py-2 rounded ${dateFilter === 'next7days' ? 'bg-primary text-white' : 'bg-secondary'}`}
                            onClick={() => setDateFilter('next7days')}
                        >
                            Next 7 days
                        </button>
                        <button
                            className={`px-4 py-2 rounded ${dateFilter === 'next14days' ? 'bg-primary text-white' : 'bg-secondary'}`}
                            onClick={() => setDateFilter('next14days')}
                        >
                            Next 14 days
                        </button>
                        <button
                            className={`px-4 py-2 rounded ${dateFilter === 'nextmonth' ? 'bg-primary text-white' : 'bg-secondary'}`}
                            onClick={() => setDateFilter('nextmonth')}
                        >
                            Next month
                        </button>
                    </div>
                </div>
                <div className="w-full sm:col-span-full mb-4">
                    <div className="flex flex-wrap justify-center gap-4">
                        {isMobile ? (
                            <>
                                <Button
                                    className="w-full sm:w-auto px-4 py-2 rounded bg-primary text-primary-foreground"
                                    onClick={() => setIsIceTypeFilterOpen(true)}
                                >
                                    Filter by Ice Type
                                </Button>
                                <Button
                                    className="w-full sm:w-auto px-4 py-2 rounded bg-primary text-primary-foreground"
                                    onClick={() => setIsTimeFilterOpen(true)}
                                >
                                    {getTimeFilterButtonText()}
                                </Button>
                            </>
                        ) : (
                            <>
                                <IceTypeFilters />
                                <Button
                                    variant="outline"
                                    onClick={() => setIsTimeFilterOpen(true)}
                                >
                                    {getTimeFilterButtonText()}
                                </Button>
                            </>
                        )}
                    </div>
                </div>
                <div className="w-full sm:col-span-full mb-4 flex justify-center">
                    <Button
                        className="px-4 py-2 rounded bg-secondary text-secondary-foreground"
                        onClick={clearFilters}
                    >
                        Clear Filters
                    </Button>
                </div>
            </div>
            <FilterDialog
                isOpen={isIceTypeFilterOpen}
                onOpenChange={setIsIceTypeFilterOpen}
                title="Ice Type Filters"
                description="Select the ice types you want to filter by."
                onApply={() => {/* Apply ice type filters */}}
            >
                <IceTypeFilters />
            </FilterDialog>
            <FilterDialog
                isOpen={isTimeFilterOpen}
                onOpenChange={setIsTimeFilterOpen}
                title="Time Range Filter"
                description="Set the time range for your filter."
                onApply={() => {/* Apply time range filter */}}
            >
                <TimeRangeFilter />
            </FilterDialog>
            <div className="col-span-3">
                {filteredIceData.length > 0 ? (
                    <>
                        <div className="grid grid-cols-6 gap-4 font-bold mb-2">
                            <div>Ice Type</div>
                            <div>Date</div>
                            <div>Time</div>
                            <div>Rink</div>
                            <div>Location</div>
                            <div>Distance</div>
                        </div>
                        {filteredIceData.map((item, index) => (
                            <div key={index} className="grid grid-cols-6 gap-4 py-2 border-b">
                                <div>
                                    {getReadableIceTimeType(item.type)}
                                    {item.type === IceTimeTypeEnum.OTHER && item.originalIceType && (
                                        <div className="text-xs text-gray-500">{item.originalIceType}</div>
                                    )}
                                </div>
                                <div>{item.date}</div>
                                <div>{`${item.startTime} - ${item.endTime}`}</div>
                                <div>
                                    <a href={item.rink.website || '#'} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                                        {item.rink.name}
                                    </a>
                                </div>
                                <div>{item.rink.location}</div>
                                <div>
                                    {item.distance !== undefined 
                                        ? `${item.distance.toFixed(1)} km` 
                                        : item.rink.latitude && item.rink.longitude 
                                            ? 'Calculating...' 
                                            : 'N/A'}
                                </div>
                            </div>
                        ))}
                    </>
                ) : (
                    <div className="text-center p-8 bg-muted rounded-lg w-full">
                        <p className="text-lg text-muted-foreground">
                            No ice time available with the selected filters. Please try different options.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}