# Route Codes Directory

This directory contains route definitions for Cebu jeepney routes.

## File Structure

Each route should be in its own file named after the route code (e.g., `01C.ts`, `01K.ts`, etc.).

## Adding a New Route from KML

### Option 1: Manual Conversion (Recommended)

1. **Parse your KML file** using the `kmlParser.ts` utility:
   - Open your KML file
   - Find the `<coordinates>` tags
   - Extract the coordinate pairs (format: `longitude,latitude,altitude`)

2. **Create a new route file** (e.g., `02B.ts`):
   ```typescript
   import type { Coordinate } from './kmlParser';

   export type RouteDefinition = {
     code: string;
     label: string;
     stops: string[];
     coordinates?: Coordinate[];
     returnCoordinates?: Coordinate[];
   };

   // KML coordinates (convert from KML format: longitude,latitude to latitude,longitude)
   const kmlCoordinates02B = [
     { latitude: 10.30032, longitude: 123.88673 },
     // ... more coordinates
   ];

   export const route02B: RouteDefinition = {
     code: '02B',
     label: '02B - CSBT to Colon',
     stops: [
       'Stop 1',
       'Stop 2',
       // ... all stops
     ],
     coordinates: kmlCoordinates02B,
   };

   export default route02B;
   ```

3. **Import and add to ROUTE_DATABASE** in `app/(tabs)/fares.tsx`:
   ```typescript
   import route02B from '@/Route Codes/02B';
   
   const ROUTE_DATABASE: Record<string, RouteDefinition> = {
     [route01C.code]: route01C,
     [route02B.code]: route02B, // Add your new route
     // ... other routes
   };
   ```

### Option 2: Using Online KML Parser

1. Use an online KML to JSON converter
2. Extract the coordinates array
3. Convert format from `[longitude, latitude]` to `{ latitude, longitude }`
4. Follow steps 2-3 from Option 1

## KML Coordinate Format

KML files use: `longitude,latitude,altitude`

Our route definitions use: `{ latitude, longitude }`

**Example conversion:**
- KML: `123.88673,10.30032,0`
- Route: `{ latitude: 10.30032, longitude: 123.88673 }`

## Route Definition Fields

- `code`: Route code (e.g., '01C', '02B')
- `label`: Display label (e.g., '01C - Private to Colon')
- `stops`: Array of stop names in order
- `coordinates`: Main route path coordinates from KML (optional but recommended)
- `returnCoordinates`: Return route coordinates if available (optional)

## Notes

- Routes with KML coordinates will display the exact path on the map
- Routes without coordinates will use Google Directions API as fallback
- Make sure stop names match exactly with what passengers will search for


