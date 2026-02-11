-- RPC Functions for SF School Navigator

-- Find attendance area containing a given point
create or replace function find_attendance_area(
  point_lng double precision,
  point_lat double precision
)
returns table (id uuid, name text) as $$
begin
  return query
    select a.id, a.name
    from attendance_areas a
    where ST_Covers(
      a.geometry,
      ST_SetSRID(ST_MakePoint(point_lng, point_lat), 4326)
    )
    limit 1;
end;
$$ language plpgsql stable;

-- Calculate distance (km) between a point and all programs
create or replace function programs_within_distance(
  point_lng double precision,
  point_lat double precision,
  max_distance_km double precision
)
returns table (
  program_id uuid,
  distance_km double precision
) as $$
begin
  return query
    select
      p.id as program_id,
      ST_Distance(
        p.coordinates::geography,
        ST_SetSRID(ST_MakePoint(point_lng, point_lat), 4326)::geography
      ) / 1000.0 as distance_km
    from programs p
    where p.coordinates is not null
      and ST_DWithin(
        p.coordinates::geography,
        ST_SetSRID(ST_MakePoint(point_lng, point_lat), 4326)::geography,
        max_distance_km * 1000
      )
    order by distance_km;
end;
$$ language plpgsql stable;
