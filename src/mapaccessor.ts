import { Pos, Rect } from './utils';
import { TileInfo, TileBase } from './tiles';
import { Entity } from "./entity";
import { RoomInfo } from './generators';

export interface MapAccessor {
    mapRect: Rect;
    mouseMapPos: Pos;
    floodSeq: number;
    mapGet(x: number, y: number): TileInfo;
    mapPGet(pos: Pos): TileInfo;
    mapSet(x: number, y: number, tile: TileBase): TileInfo;
    mapPSet(pos: Pos, tile: TileBase): TileInfo;
    mapClear(pos: Pos): void;
    setEntrance(pos: Pos): void;
    addEntity(pos: Pos, entity: Entity): void;
    floodMap(from: Array<Pos>, maxDist: number): void;
    mapToScreen(pos: Pos): Pos;
    getPlayer(): Entity;
    calcPath(from: Pos, to: Pos): Pos[];
    setRoomsInfo(rooms: RoomInfo[]): void;
    getRoomsInfo(): RoomInfo[];
}
