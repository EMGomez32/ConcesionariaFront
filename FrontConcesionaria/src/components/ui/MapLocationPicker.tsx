import React, { useEffect, useRef, useState, useCallback } from 'react';
import Modal from './Modal';
import Button from './Button';
import { MapPin, Navigation, X } from 'lucide-react';

interface MapLocationPickerProps {
    isOpen: boolean;
    onClose: () => void;
    onSelectLocation: (address: string, lat: number, lng: number) => void;
    initialAddress?: string;
}

declare global {
    interface Window {
        google: any;
        initMap: () => void;
    }
}

const MapLocationPicker: React.FC<MapLocationPickerProps> = ({
    isOpen,
    onClose,
    onSelectLocation,
    initialAddress = ''
}) => {
    const mapRef = useRef<HTMLDivElement>(null);
    const mapInstanceRef = useRef<any>(null);
    const markerInstanceRef = useRef<any>(null);
    const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number } | null>(null);
    const [selectedAddress, setSelectedAddress] = useState<string>('');
    const [isLoading, setIsLoading] = useState(false);
    const [mapReady, setMapReady] = useState(false);

    // Resetear estado cuando se cierra el modal
    useEffect(() => {
        if (!isOpen) {
            setSelectedLocation(null);
            setSelectedAddress('');
            setMapReady(false);
        }
    }, [isOpen]);

    const getAddressFromCoordinates = useCallback(async (lat: number, lng: number) => {
        if (!window.google) return;
        
        setIsLoading(true);
        try {
            const geocoder = new window.google.maps.Geocoder();
            const result = await geocoder.geocode({ location: { lat, lng } });
            
            if (result.results && result.results[0]) {
                const address = result.results[0].formatted_address;
                setSelectedAddress(address);
                setSelectedLocation({ lat, lng });
            }
        } catch (error) {
            console.error('Error al obtener dirección:', error);
            setSelectedAddress(`Lat: ${lat.toFixed(6)}, Lng: ${lng.toFixed(6)}`);
            setSelectedLocation({ lat, lng });
        } finally {
            setIsLoading(false);
        }
    }, []);

    const placeMarker = useCallback((location: { lat: number; lng: number }) => {
        if (!mapInstanceRef.current || !markerInstanceRef.current) return;
        
        markerInstanceRef.current.setPosition(location);
        markerInstanceRef.current.setVisible(true);
        mapInstanceRef.current.panTo(location);
        getAddressFromCoordinates(location.lat, location.lng);
    }, [getAddressFromCoordinates]);

    const geocodeAddress = useCallback(async (address: string) => {
        if (!address || !window.google) return;
        
        setIsLoading(true);
        try {
            const geocoder = new window.google.maps.Geocoder();
            const result = await geocoder.geocode({ address });
            
            if (result.results && result.results[0]) {
                const location = result.results[0].geometry.location;
                const lat = location.lat();
                const lng = location.lng();
                placeMarker({ lat, lng });
            }
        } catch (error) {
            console.error('Error al geocodificar:', error);
        } finally {
            setIsLoading(false);
        }
    }, [placeMarker]);

    const initializeMap = useCallback(() => {
        if (!mapRef.current) {
            console.warn('⚠️ mapRef.current no está disponible');
            return;
        }
        
        if (!window.google) {
            console.warn('⚠️ window.google no está disponible');
            return;
        }

        console.log('🗺️ Inicializando mapa...');

        try {
            // Coordenadas por defecto (Buenos Aires, Argentina)
            const defaultCenter = { lat: -34.6037, lng: -58.3816 };

            const newMap = new window.google.maps.Map(mapRef.current, {
                center: defaultCenter,
                zoom: 13,
                mapTypeControl: false,
                streetViewControl: false,
                fullscreenControl: false,
            });

            console.log('✅ Mapa creado exitosamente');

            const newMarker = new window.google.maps.Marker({
                map: newMap,
                draggable: true,
                animation: window.google.maps.Animation.DROP,
                visible: false,
            });

            console.log('✅ Marcador creado exitosamente');

            // Evento click en el mapa
            newMap.addListener('click', (e: any) => {
                const lat = e.latLng.lat();
                const lng = e.latLng.lng();
                placeMarker({ lat, lng });
            });

            // Evento drag del marcador
            newMarker.addListener('dragend', (e: any) => {
                const lat = e.latLng.lat();
                const lng = e.latLng.lng();
                getAddressFromCoordinates(lat, lng);
            });

            mapInstanceRef.current = newMap;
            markerInstanceRef.current = newMarker;
            setMapReady(true);

            console.log('✅ Mapa completamente inicializado y listo');

            // Si hay una dirección inicial, geocodificarla después de que el mapa esté listo
            if (initialAddress) {
                console.log(`📍 Geocodificando dirección inicial: ${initialAddress}`);
                setTimeout(() => geocodeAddress(initialAddress), 500);
            }
        } catch (error) {
            console.error('❌ Error al inicializar el mapa:', error);
            alert('Error al inicializar el mapa de Google. Por favor, recarga la página.');
        }
    }, [initialAddress, placeMarker, geocodeAddress, getAddressFromCoordinates]);

    // Cargar Google Maps API y inicializar el mapa
    useEffect(() => {
        if (!isOpen) {
            console.log('📴 Modal cerrado, no se inicializa el mapa');
            return;
        }

        console.log('🚀 useEffect: Modal abierto, iniciando carga de Google Maps...');

        const loadGoogleMaps = () => {
            if (!window.google) {
                console.log('📦 Google Maps no está cargado, cargando script...');
                
                const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
                if (existingScript) {
                    console.log('📜 Script ya existe, esperando a que se cargue...');
                    existingScript.addEventListener('load', () => {
                        console.log('✅ Script existente cargado');
                        setTimeout(initializeMap, 100);
                    });
                    return;
                }

                const script = document.createElement('script');
                const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';
                
                // Advertencia si no hay API key configurada
                if (!apiKey) {
                    console.warn('⚠️ Google Maps API Key no configurada. El mapa tendrá marca de agua y funcionalidad limitada.');
                    console.info('📖 Lee GOOGLE_MAPS_SETUP.md para configurar tu API Key.');
                }
                
                script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
                script.async = true;
                script.defer = true;
                script.onload = () => {
                    console.log('✅ Google Maps API cargada correctamente desde script nuevo');
                    setTimeout(initializeMap, 200);
                };
                script.onerror = (err) => {
                    console.error('❌ Error al cargar Google Maps API:', err);
                    alert('Error al cargar Google Maps. Por favor, verifica tu conexión a internet.');
                };
                
                console.log('📡 Añadiendo script al DOM...');
                document.head.appendChild(script);
            } else {
                console.log('✅ Google Maps ya está cargado, inicializando mapa directamente...');
                setTimeout(initializeMap, 100);
            }
        };

        loadGoogleMaps();
        
        // Cleanup
        return () => {
            console.log('🧹 Limpiando efecto de Google Maps');
        };
    }, [isOpen, initializeMap]);

    const handleGetCurrentLocation = () => {
        if (!navigator.geolocation) {
            alert('Tu navegador no soporta geolocalización');
            return;
        }

        setIsLoading(true);
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const location = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                };
                placeMarker(location);
                setIsLoading(false);
            },
            (error) => {
                console.error('Error al obtener ubicación:', error);
                alert('No se pudo obtener la ubicación actual. Por favor, verifica los permisos de ubicación.');
                setIsLoading(false);
            }
        );
    };

    const handleConfirm = () => {
        if (selectedLocation && selectedAddress) {
            onSelectLocation(selectedAddress, selectedLocation.lat, selectedLocation.lng);
            onClose();
        }
    };

    const handleClose = () => {
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={handleClose} title="Seleccionar Ubicación" maxWidth="900px">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{
                    padding: '1rem',
                    background: 'var(--bg-secondary)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border)'
                }}>
                    <div style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'space-between',
                        marginBottom: '0.75rem',
                        flexWrap: 'wrap',
                        gap: '0.5rem'
                    }}>
                        <p style={{ 
                            fontSize: '0.875rem', 
                            color: 'var(--text-secondary)',
                            fontWeight: '600',
                            flex: 1,
                            minWidth: '200px'
                        }}>
                            Haz clic en el mapa para marcar la ubicación o arrastra el marcador
                        </p>
                        <Button
                            variant="secondary"
                            onClick={handleGetCurrentLocation}
                            loading={isLoading}
                            disabled={!mapReady}
                            style={{ fontSize: '0.875rem', padding: '0.5rem 1rem' }}
                        >
                            <Navigation size={16} />
                            Mi Ubicación
                        </Button>
                    </div>
                    
                    {selectedAddress && (
                        <div style={{
                            padding: '0.75rem',
                            background: 'var(--bg-card)',
                            borderRadius: 'var(--radius-sm)',
                            border: '1px solid var(--border)',
                            display: 'flex',
                            alignItems: 'start',
                            gap: '0.5rem'
                        }}>
                            <MapPin size={16} style={{ 
                                color: 'var(--accent)', 
                                marginTop: '0.125rem',
                                flexShrink: 0 
                            }} />
                            <div style={{ flex: 1 }}>
                                <p style={{ 
                                    fontSize: '0.75rem', 
                                    color: 'var(--text-muted)',
                                    marginBottom: '0.25rem',
                                    textTransform: 'uppercase',
                                    fontWeight: '700'
                                }}>
                                    Dirección Seleccionada
                                </p>
                                <p style={{ 
                                    fontSize: '0.9375rem', 
                                    color: 'var(--text-primary)',
                                    fontWeight: '600'
                                }}>
                                    {selectedAddress}
                                </p>
                                {selectedLocation && (
                                    <p style={{ 
                                        fontSize: '0.75rem', 
                                        color: 'var(--text-muted)',
                                        marginTop: '0.25rem'
                                    }}>
                                        Lat: {selectedLocation.lat.toFixed(6)}, Lng: {selectedLocation.lng.toFixed(6)}
                                    </p>
                                )}
                            </div>
                        </div>
                    )}

                    {!mapReady && (
                        <div style={{
                            padding: '0.75rem',
                            background: 'var(--bg-card)',
                            borderRadius: 'var(--radius-sm)',
                            border: '1px solid var(--border)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            color: 'var(--text-secondary)',
                            fontSize: '0.875rem'
                        }}>
                            <div className="loader" style={{ width: '14px', height: '14px' }}></div>
                            Cargando mapa...
                        </div>
                    )}
                </div>

                <div 
                    ref={mapRef} 
                    style={{ 
                        width: '100%', 
                        height: '500px',
                        borderRadius: 'var(--radius-md)',
                        border: '2px solid var(--border)',
                        overflow: 'hidden',
                        position: 'relative',
                        background: 'var(--bg-secondary)'
                    }}
                >
                    {!mapReady && (
                        <div style={{
                            position: 'absolute',
                            top: '50%',
                            left: '50%',
                            transform: 'translate(-50%, -50%)',
                            textAlign: 'center',
                            color: 'var(--text-muted)'
                        }}>
                            <div className="loader" style={{ 
                                width: '32px', 
                                height: '32px',
                                margin: '0 auto 1rem'
                            }}></div>
                            <p style={{ fontSize: '0.875rem', fontWeight: '600' }}>
                                Inicializando Google Maps...
                            </p>
                        </div>
                    )}
                </div>

                <div style={{ 
                    display: 'flex', 
                    gap: '1rem', 
                    justifyContent: 'flex-end',
                    paddingTop: '0.5rem'
                }}>
                    <Button variant="secondary" onClick={handleClose}>
                        <X size={16} />
                        Cancelar
                    </Button>
                    <Button 
                        variant="primary" 
                        onClick={handleConfirm}
                        disabled={!selectedLocation || !selectedAddress || isLoading}
                    >
                        <MapPin size={16} />
                        Confirmar Ubicación
                    </Button>
                </div>
            </div>
        </Modal>
    );
};

export default MapLocationPicker;
