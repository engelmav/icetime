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
import { LocationSelector } from './LocationSelector';

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
    const [userLocation, setUserLocation] = useState<{ lat: number; lon: number; city: string } | null>(null);
    const [guessedLocation, setGuessedLocation] = useState<string | null>(null);
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
    const [groupByIceType, setGroupByIceType] = useState(false);
    const [groupByRink, setGroupByRink] = useState(false);
    const [selectedLocation, setSelectedLocation] = useState<string | null>(null);
    const [distanceFilter, setDistanceFilter] = useState<number | null>(null);
    const [iceData, setIceData] = useState<IceDataItem[]>([]);
    const [calculatedDistances, setCalculatedDistances] = useState<IceDataItem[]>([]);

    useEffect(() => {
        async function getUserLocation() {
            try {
                const response = await fetch('https://ipapi.co/json/');
                const data = await response.json();
                setUserLocation({ lat: data.latitude, lon: data.longitude, city: data.city });
                setGuessedLocation(data.city);
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
            const newData = iceData.map(item => {
                if (!item.rink.latitude || !item.rink.longitude) {
                    console.warn(`Missing coordinates for rink: ${item.rink.name}`);
                    return item;
                }
                const distance = calculateDistance(
                    userLocation.lat,
                    userLocation.lon,
                    item.rink.latitude,
                    item.rink.longitude
                );
                return { ...item, distance };
            });
            setCalculatedDistances(newData);
        }
    }, [userLocation, iceData, calculateDistance]);

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
                distanceFilter: distanceFilter !== null ? distanceFilter.toString() : '',
            });

            try {
                const response = await fetch(`/api/ice-data?${params.toString()}`);
                if (!response.ok) {
                    throw new Error('Failed to fetch ice data');
                }
                const data: IceDataItem[] = await response.json();
                setIceData(data);
            } catch (error) {
                console.error('Error fetching ice data:', error);
            }
        }

        fetchIceData();
    }, [openSkate, stickTime, openHockey, substituteRequest, learnToSkate, youthClinic, adultClinic, other, dateFilter, startTime, endTime, distanceFilter]);

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
        setDistanceFilter(null);
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

    const countIceTypes = useCallback(() => {
        const counts = {
            openSkate: 0,
            stickTime: 0,
            openHockey: 0,
            substituteRequest: 0,
            learnToSkate: 0,
            youthClinic: 0,
            adultClinic: 0,
            other: 0
        };

        filteredIceData.forEach(item => {
            switch (item.type) {
                case IceTimeTypeEnum.OPEN_SKATE:
                    counts.openSkate++;
                    break;
                case IceTimeTypeEnum.STICK_TIME:
                    counts.stickTime++;
                    break;
                case IceTimeTypeEnum.OPEN_HOCKEY:
                    counts.openHockey++;
                    break;
                case IceTimeTypeEnum.SUBSTITUTE_REQUEST:
                    counts.substituteRequest++;
                    break;
                case IceTimeTypeEnum.LEARN_TO_SKATE:
                    counts.learnToSkate++;
                    break;
                case IceTimeTypeEnum.YOUTH_CLINIC:
                    counts.youthClinic++;
                    break;
                case IceTimeTypeEnum.ADULT_CLINIC:
                    counts.adultClinic++;
                    break;
                case IceTimeTypeEnum.OTHER:
                    counts.other++;
                    break;
            }
        });

        return counts;
    }, [filteredIceData]);

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

    const IceTypeFilters = () => {
        const counts = countIceTypes();
        return (
            <>
                <label className="flex items-center">
                    <input
                        type="checkbox"
                        className="mr-2"
                        checked={openSkate}
                        onChange={(e) => setOpenSkate(e.target.checked)}
                    />
                    Open Skate ({counts.openSkate})
                </label>
                <label className="flex items-center">
                    <input
                        type="checkbox"
                        className="mr-2"
                        checked={stickTime}
                        onChange={(e) => setStickTime(e.target.checked)}
                    />
                    Stick Time ({counts.stickTime})
                </label>
                <label className="flex items-center">
                    <input
                        type="checkbox"
                        className="mr-2"
                        checked={openHockey}
                        onChange={(e) => setOpenHockey(e.target.checked)}
                    />
                    Open Hockey ({counts.openHockey})
                </label>
                <label className="flex items-center">
                    <input
                        type="checkbox"
                        className="mr-2"
                        checked={substituteRequest}
                        onChange={(e) => setSubstituteRequest(e.target.checked)}
                    />
                    Substitute Request ({counts.substituteRequest})
                </label>
                <label className="flex items-center">
                    <input
                        type="checkbox"
                        className="mr-2"
                        checked={learnToSkate}
                        onChange={(e) => setLearnToSkate(e.target.checked)}
                    />
                    Learn to Skate ({counts.learnToSkate})
                </label>
                <label className="flex items-center">
                    <input
                        type="checkbox"
                        className="mr-2"
                        checked={youthClinic}
                        onChange={(e) => setYouthClinic(e.target.checked)}
                    />
                    Youth Clinic ({counts.youthClinic})
                </label>
                <label className="flex items-center">
                    <input
                        type="checkbox"
                        className="mr-2"
                        checked={adultClinic}
                        onChange={(e) => setAdultClinic(e.target.checked)}
                    />
                    Adult Clinic ({counts.adultClinic})
                </label>
                <label className="flex items-center">
                    <input
                        type="checkbox"
                        className="mr-2"
                        checked={other}
                        onChange={(e) => setOther(e.target.checked)}
                    />
                    Other ({counts.other})
                </label>
            </>
        );
    };

    const TimeRangeFilter = () => (
        <TimeRangePicker
            startTime={startTime}
            endTime={endTime}
            onTimeRangeChange={handleTimeRangeChange}
        />
    );

    const filteredByDistance = useCallback(() => {
        if (distanceFilter === null) {
            return calculatedDistances;
        }
        return calculatedDistances.filter(item => {
            if (item.distance === undefined) {
                return false;
            }
            return item.distance <= distanceFilter;
        });
    }, [calculatedDistances, distanceFilter]);

    const groupedData = useCallback(() => {
        const dataToGroup = filteredByDistance();
        if (groupByIceType) {
            return dataToGroup.reduce((acc, item) => {
                const key = getReadableIceTimeType(item.type);
                if (!acc[key]) acc[key] = [];
                acc[key].push(item);
                return acc;
            }, {} as Record<string, IceDataItem[]>);
        } else if (groupByRink) {
            return dataToGroup.reduce((acc, item) => {
                const key = item.rink.name;
                if (!acc[key]) {
                    acc[key] = {
                        items: [],
                        location: item.rink.location,
                        distance: item.distance,
                        website: item.rink.website
                    };
                }
                acc[key].items.push(item);
                return acc;
            }, {} as Record<string, { items: IceDataItem[], location: string, distance?: number, website?: string | null }>);
        }
        return null;
    }, [filteredByDistance, groupByIceType, groupByRink]);

    const renderIceDataTable = (data: IceDataItem[], showIceType: boolean = true, showRink: boolean = true) => {
        return (
            <>
                <div className={`grid ${showIceType && showRink ? 'grid-cols-4' : 'grid-cols-3'} gap-4 font-bold mb-2 pb-2 border-b`}>
                    {showIceType && <div>Ice Type</div>}
                    <div>Date</div>
                    <div>Time</div>
                    {showRink && <div>Rink</div>}
                </div>
                {data.map((item, index) => (
                    <div key={index} className={`grid ${showIceType && showRink ? 'grid-cols-4' : 'grid-cols-3'} gap-4 py-2 border-b`}>
                        {showIceType && (
                            <div>
                                {getReadableIceTimeType(item.type)}
                                {item.type === IceTimeTypeEnum.OTHER && item.originalIceType && (
                                    <div className="text-xs text-gray-500">{item.originalIceType}</div>
                                )}
                            </div>
                        )}
                        <div>{item.date}</div>
                        <div>{`${item.startTime} - ${item.endTime}`}</div>
                        {showRink && (
                            <div>
                                <a href={item.rink.website || '#'} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                                    {item.rink.name}
                                </a>
                                <div className="text-xs text-gray-500">{item.rink.location}</div>
                                {item.distance !== undefined && (
                                    <div className="text-xs text-gray-500">{`${item.distance.toFixed(1)} km away`}</div>
                                )}
                            </div>
                        )}
                    </div>
                ))}
            </>
        );
    };

    const handleGrouping = (type: 'ice' | 'rink') => {
        if (type === 'ice') {
            setGroupByIceType(!groupByIceType);
            setGroupByRink(false);
        } else {
            setGroupByRink(!groupByRink);
            setGroupByIceType(false);
        }
    };

    const handleLocationChange = (location: { lat: number; lon: number; city: string }) => {
        console.log('Location changed:', location);
        setUserLocation(location);
        setSelectedLocation(location.city);
        setGuessedLocation(location.city);
    };

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
                        <div className="flex flex-wrap justify-center gap-4">
                            <LocationSelector 
                                key={selectedLocation || guessedLocation}
                                onLocationChange={handleLocationChange} 
                                selectedLocation={selectedLocation || guessedLocation}
                            />
                            <div className="flex items-center">
                            <span>within</span>
                                <Input
                                    type="number"
                                    placeholder="km"
                                    className="w-16 mx-2 border border-gray-300" // Added border
                                    min="1" // Prevent inputs less than 1
                                    value={distanceFilter !== null ? distanceFilter : ''}
                                    onChange={(e) => {
                                        const value = e.target.value === '' ? null : Math.max(1, Number(e.target.value));
                                        setDistanceFilter(value);
                                    }}
                                />
                                <span>km</span>
                            </div>
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
                            <Button
                                variant="outline"
                                onClick={() => setIsTimeFilterOpen(true)}
                            >
                                {getTimeFilterButtonText()}
                            </Button>
                        </div>
                    </div>
                </div>
                <div className="w-full sm:col-span-full mb-4">
                    <div className="flex flex-wrap justify-center gap-4">
                        {isMobile ? (
                            <Button
                                className="w-full sm:w-auto px-4 py-2 rounded bg-primary text-primary-foreground"
                                onClick={() => setIsIceTypeFilterOpen(true)}
                            >
                                Filter by Ice Type
                            </Button>
                        ) : (
                            <IceTypeFilters />
                        )}
                    </div>
                </div>
                <div className="w-full sm:col-span-full mb-4 flex justify-center">
                    <Button
                        className="px-4 py-2 rounded bg-secondary text-secondary-foreground mr-2"
                        onClick={() => handleGrouping('ice')}
                    >
                        {groupByIceType ? 'Ungroup' : 'Group by Ice Type'}
                    </Button>
                    <Button
                        className="px-4 py-2 rounded bg-secondary text-secondary-foreground mr-2"
                        onClick={() => handleGrouping('rink')}
                    >
                        {groupByRink ? 'Ungroup' : 'Group by Rink'}
                    </Button>
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
                {filteredByDistance().length > 0 ? (
                    groupByIceType || groupByRink ? (
                        Object.entries(groupedData() || {}).map(([groupName, data]) => (
                            <div key={groupName} className="mb-8">
                                {groupByRink ? (
                                    <div className="mb-4">
                                        <h3 className="text-xl font-bold">
                                            <a href={data.website || '#'} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                                                {groupName}
                                            </a>
                                        </h3>
                                        <div className="text-sm text-gray-500">{data.location}</div>
                                        {data.distance !== undefined && (
                                            <div className="text-sm text-gray-500">{`${data.distance.toFixed(1)} km away`}</div>
                                        )}
                                    </div>
                                ) : (
                                    <h3 className="text-xl font-bold mb-4">{groupName}</h3>
                                )}
                                {renderIceDataTable(groupByRink ? data.items : data, !groupByIceType, !groupByRink)}
                            </div>
                        ))
                    ) : (
                        renderIceDataTable(filteredByDistance())
                    )
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