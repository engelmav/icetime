import { useState, useEffect } from 'react';
import { Button } from '@/libs/ui/button';
import { CustomDialog } from './FilterDialog';
import { Input } from '@/libs/ui/input';
import { useLoadScript, Autocomplete } from '@react-google-maps/api';


// Define libraries array outside of the component
const libraries: ("places")[] = ["places"];

interface LocationSelectorProps {
  onLocationChange: (location: { lat: number; lon: number; city: string }) => void;
  selectedLocation: string | null;
}

export function LocationSelector({ onLocationChange, selectedLocation }: LocationSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchInput, setSearchInput] = useState('');
  const [autocomplete, setAutocomplete] = useState<google.maps.places.Autocomplete | null>(null);

  const { isLoaded } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!,
    libraries: libraries,
  });

  const onLoad = (autocompleteInstance: google.maps.places.Autocomplete) => {
    setAutocomplete(autocompleteInstance);
  };

  const handlePlaceChanged = () => {
    if (autocomplete) {
      const place = autocomplete.getPlace();
      handlePlaceSelect(place);
    }
  };

  const handlePlaceSelect = (place: google.maps.places.PlaceResult) => {
    if (place.geometry && place.geometry.location) {
      const lat = place.geometry.location.lat();
      const lon = place.geometry.location.lng();
      const city = place.name || '';
      onLocationChange({ lat, lon, city });
    }
  };

  return (
    <>
      <Button variant="outline" onClick={() => setIsOpen(true)}>
        {selectedLocation ? `Location: ${selectedLocation}` : 'Set Location'}
      </Button>
      <CustomDialog open={isOpen} onOpenChange={setIsOpen} showApplyButton={false}>
        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Set Your Location</h2>
            <p className="text-sm text-muted-foreground">
              {selectedLocation 
                ? `Current location: ${selectedLocation}. Enter a new location to update.` 
                : 'Enter your location to find nearby ice times.'}
            </p>
          </div>
          <div className="max-h-60 overflow-y-auto">
            {isLoaded ? (
              <Autocomplete
                onLoad={onLoad}
                onPlaceChanged={handlePlaceChanged}
              >
                <Input
                  type="text"
                  placeholder="Enter your location"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                />
              </Autocomplete>
            ) : (
              <div>Loading...</div>
            )}
          </div>
        </div>
      </CustomDialog>
    </>
  );
}