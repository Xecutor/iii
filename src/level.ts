import { uiManager } from './uimanager';
import { Animation } from './animation';
import { Player } from './player';
import { Entity } from './entity';
import { TileInfo, TileBase, StairsDownTile } from './tiles';
import { RoomInfo } from './generators';
import { MapAccessor } from "./mapaccessor";
import { TileManager, tileSize, tileFullSize } from './tilemanager';
import { hudWIdth } from './hud';
import { UIBase, MyMouseEvent } from './uibase';
import * as gr from './graphics'
import { Rect, Pos, dirX, dirY, DIR, diffToDir, Size } from './utils';
import ROT from './rotwrap';
import { showMessageBox } from './msgbox';
import { MainMenu } from './mainmenu';
import { Door } from './terrainentities';
import { AbilityList } from './abilitylist';
import { Ability, AbilityTargetType, AbilityTarget } from './abilities';
import { idleColor } from './colors';
import { PlayerActions } from './playeractions';
//import { isSupported } from 'rot-js';

class CallbackAnimation implements Animation {
    callback: () => boolean;
    constructor(callback: () => boolean) {
        this.callback = callback;
    }
    nextFrame(): boolean {
        return this.callback();
    }
}

const moveKeys = [['up', 'w'], ['down', 's'], ['left', 'a'], ['right', 'd']]

const dirTiles = ['dir-up', 'dir-down', 'dir-left', 'dir-right']

class DirTargetSelector extends UIBase {
    off = 0
    offDir = 1
    constructor(public map:MapAccessor, public pos:Pos, public onSelect:(dir:DIR)=>void) {
        super()
    }
    onAdd() {
        for (let i = 0; i < 4; ++i) {
            this.bindings.bind(moveKeys[i], () => this.onPress(i))
        }
        this.bindings.bind('escape', ()=>this.close())
    }
    onClick = (e:MyMouseEvent)=>{
        let mpos = new Pos(e.x, e.y)
        let basePos = this.map.mapToScreen(this.pos)
        for(let dir = 0; dir< 4; ++dir) {
            let rect = new Rect(basePos.clone().add(dirX[dir]*tileSize, dirY[dir]*tileSize), new Size(tileSize, tileSize))
            if(rect.isInside(mpos)) {
                this.close()
                this.onSelect(dir)
                return
            }
        }
    }
    onPress(dir:DIR) {
        this.close()
        this.onSelect(dir)
    }
    draw() {
        let basePos = this.map.mapToScreen(this.pos)
        for(let dir = 0; dir< 4; ++dir) {
            let pos = basePos.clone().add(dirX[dir]*(tileSize + this.off), dirY[dir]*(tileSize + this.off))
            TileManager.instance.drawTile(pos, dirTiles[dir])
        }
        this.off += this.offDir
        if(this.off <= -5 || this.off >=5) {
            this.offDir = -this.offDir
        }
    }
}

export class Level extends UIBase implements MapAccessor {
    offset = new Pos();
    dragStart: Pos = null;
    offsetStart: Pos = null;
    mapRect = new Rect();
    map: { [xy: string]: TileInfo } = {};
    entrance: Pos;

    mouseMapPos = new Pos();

    debugTiles = false;

    player: Player;
    activeConn: number = 0;
    conns: Array<Pos> = [];
    connNodes: Array<Pos> = [];
    markerFrame: number = 0;

    lastPathSrc = new Pos();
    lastPathPos = new Pos();
    lastPath: Array<Pos> = [];

    mouseMoved = false;

    centerAni = new CallbackAnimation(() => this.centerStep());
    centering = false;
    centerPos: Pos;

    visAni = new CallbackAnimation(() => this.visStep())
    visTiles: Pos[] = []
    visRoomId: number

    entities: Array<Entity> = [];
    blockedDoors: Door[] = []

    floodSeq = 0;
    showFlood = false;

    runIdx = 0
    runMode = false
    runModeDir = false
    runDir : DIR

    rooms: RoomInfo[]

    pendingAbility: Ability

    constructor(public playerActions: PlayerActions) {
        super();
        let sz = gr.getAppSize();
        this.rect = new Rect(0, 0, sz.width - hudWIdth, sz.height);
    }

    setRoomsInfo(rooms: RoomInfo[]) {
        this.rooms = rooms
    }

    getRoomsInfo() {
        return this.rooms
    }

    onAdd() {
        for (let i = 0; i < 4; ++i) {
            this.bindings.bind(moveKeys[i], () => this.move(i));
            for(let key of moveKeys[i]) {
                this.bindings.bind('shift+'+key, () => this.runInDir(i));
            }
        }
        this.bindings.bind('space', () => this.passTurn())
        this.bindings.bind('q', () => this.toggleDebugTiles());
        this.bindings.bind('f', () => this.showFlood = !this.showFlood);

        this.bindings.bind('escape', ()=>this.cancelRunMode())

        //this.bindings.bind('c', ()=>this.toggleConnMode());
        //this.bindings.bind('tab', ()=>this.switchConn());
        //this.bindings.bind('b', ()=>this.branchConn());
        this.bindings.bind('shift+c', () => this.centerPlayer())

        this.bindings.bind('c', ()=>this.showAbilities())

        //this.bindings.bind('i', ()=>this.showPrograms());
    }

    toggleDebugTiles() {
        this.debugTiles = !this.debugTiles;
    }

    setEntrance(entrance: Pos) {
        this.entrance = entrance.clone();
    }

    addPlayer(player: Player) {
        player.map = this
        this.player = player;
        this.player.pos = this.entrance.clone();
        this.mapPGet(this.player.pos).addEntity(this.player);
        this.centerPlayer();
        this.startVisAni(player.pos)
    }

    centerToPos(pos: Pos) {
        if (this.centering) {
            return;
        }
        this.centering = true;
        this.centerPos = pos;
        uiManager.addAnimation(this.centerAni);
    }

    centerPlayer() {
        this.centerToPos(this.player.pos)
    }

    centerStep() {
        let pos = this.mapToScreen(this.centerPos);
        let dir = this.rect.middle().sub(pos);
        let l = dir.length();
        if (l < tileSize) {
            this.centering = false;
            return false;
        }
        dir.div(l).mul(tileSize * 2);
        this.offset.sub(dir);
        return this.centering;
    }

    startVisAni(pos: Pos) {
        this.visTiles.push(pos.clone())
        let ti = this.mapPGet(pos)
        if (ti) {
            this.visRoomId = ti.roomIdx
            if (ti.roomIdx < this.rooms.length) {
                console.log(`start vis for room ${ti.roomIdx}`)
                this.rooms[ti.roomIdx].explored = true
            }
        }
        uiManager.addAnimation(this.visAni)
    }

    visStep() {
        if (this.visTiles.length == 0) {
            console.log('vis finished')
            return false
        }
        let proc: { [key: string]: boolean } = {}
        let newVisTiles: Pos[] = []
        for (let p of this.visTiles) {
            let ti = this.mapPGet(p)
            if (!ti || ti.visible) {
                continue
            }
            ti.visible = true
            for (let i = 0; i < 4; ++i) {
                let np = p.clone().add(dirX[i], dirY[i])
                let id = np.id()
                if (proc[id]) {
                    //console.log(`already processed ${id}`)
                    continue
                }
                proc[id] = true
                ti = this.mapPGet(np)
                if (ti && !ti.visible && (ti.roomIdx == this.visRoomId || ti.alwaysVis)) {
                    newVisTiles.push(np)
                }
            }
        }
        this.visTiles = newVisTiles
        return this.visTiles.length > 0
    }

    onPlayerAction() {
        let that = this;
        this.entities = this.entities.filter(
            ent => {
                if (ent.alive) {
                    ent.onTurn();
                }
                if (!ent.alive) {
                    let ti = this.mapPGet(ent.pos)
                    ti.removeEntity(ent)
                }
                return ent.alive;
            }
        )

        if(this.entities.length==0) {
            for(let d of this.blockedDoors) {
                d.unblock()
            }
            this.blockedDoors=[]
        }

        if (!this.player.alive) {
            this.cancelRunMode()
            showMessageBox('Game Over', 'red').onClose = () => this.doClose()
        }
    }

    doClose() {
        this.parent.close()
        uiManager.add(new MainMenu)
    }

    getPlayer() {
        return this.player
    }

    interactWith(ent: Entity) {
        if (ent.isEnemy) {
            this.player.onAttack()
            ent.receiveDamage( this.player.getDamage(), this.player)
            ent.stun(this.player.getStunStrength())
            if (!ent.alive) {
                let ti = this.mapPGet(ent.pos)
                ti.removeEntity(ent)
            }
            return true;
        }
        else {
            return ent.interactWith();
        }
    }

    isCloseToBorder(pos: Pos) {
        pos = this.mapToScreen(pos);
        pos.add(tileSize / 2, tileSize / 2)
        let r = this.rect.clone();
        let threshold = new Pos(tileSize * 2, tileSize * 2);
        let br = r.bottomRight();
        r.pos.add(threshold);
        br.sub(threshold);
        r.bottomRight(br);
        return !r.isInside(pos);
    }

    exploreRoom(idx: number) {
        this.startVisAni(new Pos(this.player.pos.x, this.player.pos.y))
        if (idx >= this.rooms.length) {
            return
        }
        let r = this.rooms[idx]
        this.centerToPos(r.mrect.middle())
        let doors = []
        for (let it = r.mrect.getIterator(); it.next();) {
            let ti = this.mapPGet(it.value)
            if (ti) {
                for (let e of ti.entities) {
                    if (e.isEnemy) {
                        e.map = this
                        this.entities.push(e)
                    }
                    else if (e instanceof Door) {
                        doors.push(e as Door)
                    }
                }
            }
        }
        if (this.entities.length) {
            for (let d of doors) {
                d.block()
            }
            this.blockedDoors = doors
        }
    }

    runInDir(dir:DIR) {
        this.runMode = true
        this.runModeDir = true
        this.runDir = dir
        this.runModeStep()
    }

    move(dir: DIR, runMode = false) {
        if (!runMode) {
            this.runMode = false
            this.resetLastPath()
        }
        let dx = dirX[dir];
        let dy = dirY[dir];
        let ti = this.mapGet(this.player.pos.x + dx, this.player.pos.y + dy);
        if (ti && ti.passable) {
            if (ti.hasBlockingEntity() && this.interactWith(ti.getBlockingEntity())) {
                this.onPlayerAction();
                return;
            }
            this.player.move(dir)
            if (!ti.visible) {
                this.exploreRoom(ti.roomIdx)
            }
            if (this.isCloseToBorder(this.player.pos)) {
                this.centerPlayer();
            }
            if(ti.tile instanceof StairsDownTile) {
                this.close()
                this.playerActions.nextLevel()
            }
            else {
                this.onPlayerAction();
            }
        }
    }

    passTurn() {
        this.player.onPassTurn()
        this.onPlayerAction()
    }

    addEntity(pos: Pos, entity: Entity) {
        entity.map = this
        this.mapGet(pos.x, pos.y).addEntity(entity);
        //this.entities.push(entity);

        return true;
    }
    mapClear(pos: Pos) {
        let xy = pos.x + 'x' + pos.y;
        delete this.map[xy];
    }
    mapPSet(pos: Pos, tile: TileBase) {
        return this.mapSet(pos.x, pos.y, tile);
    }
    mapSet(x: number, y: number, tile: TileBase) {
        x |= 0
        y |= 0
        let xy = x + 'x' + y;
        let rv = new TileInfo(tile);
        rv.pos = new Pos(x, y);
        this.map[xy] = rv;
        let tlx = this.mapRect.pos.x;
        let tly = this.mapRect.pos.y;
        let uptl = false;
        if (x < tlx) {
            tlx = x;
            uptl = true;
        }
        if (y < tly) {
            tly = y;
            uptl = true;
        }
        if (uptl) {
            this.mapRect.setTopLeft(new Pos(tlx, tly));
        }
        let br = this.mapRect.bottomRight();
        let upbr = false;
        if (x + 1 > br.x) {
            upbr = true;
            br.x = x + 1;
        }
        if (y + 1 > br.y) {
            br.y = y + 1;
            upbr = true;
        }
        if (upbr) {
            this.mapRect.bottomRight(br);
        }
        return rv;
    }
    mapGet(x: number, y: number) {
        x |= 0
        y |= 0
        let xy = x + 'x' + y;
        return this.map[xy];
    }

    mapPGet(pos: Pos) {
        let x = pos.x
        let y = pos.y
        x |= 0
        y |= 0
        let xy = x + 'x' + y;
        return this.map[xy];
    }

    mapToScreen(pos: Pos) {
        return pos.clone().mul(tileSize).sub(this.offset);
    }

    draw() {
        if(this.runMode) {
            this.runModeStep()
        }
        if (this.debugTiles) {
            let ctx = gr.getCtx();
            let c = TileManager.instance.cacheCanvas;
            ctx.drawImage(c, 0, 0, c.width, c.height, 0, 0, c.width, c.height);
            ctx.fillStyle = 'rgba(255,255,255,0.3)';
            ctx.fillRect(this.mouseMapPos.x * tileFullSize, this.mouseMapPos.y * tileFullSize, tileFullSize, tileFullSize);
            return;
        }
        const countX = Math.ceil(this.rect.size.width / tileSize) + 1;
        const countY = Math.ceil(this.rect.size.height / tileSize) + 1;
        gr.setClip(this.rect);
        let pos = this.offset.clone();
        let x0 = Math.floor(pos.x / tileSize);
        let y0 = Math.floor(pos.y / tileSize);
        pos.x = -((pos.x % tileSize + tileSize) % tileSize);
        pos.y = -((pos.y % tileSize + tileSize) % tileSize);
        let pos0 = pos.clone();
        for (let y = 0; y < countY; ++y) {
            for (let x = 0; x < countX; ++x) {
                let ti = this.mapGet(x0 + x, y0 + y);
                if (ti && ti.visible) {
                    if (ti.tintColor) {
                        TileManager.instance.drawTileTinted(pos, ti.tileName, ti.tintColor, ti.tileFrame);
                    }
                    else {
                        TileManager.instance.drawTile(pos, ti.tileName, ti.tileFrame);
                    }
                    for (let en of ti.entities) {
                        TileManager.instance.drawTile(pos, en.tileName, en.tileFrame);
                    }
                    for (let en of ti.entities) {
                        for(let eff of en.effects) {
                            TileManager.instance.drawTile(pos, eff.tileName, eff.frame)
                            ++eff.frame
                        }
                    }
                    if (this.showFlood && ti.floodSeq == this.floodSeq) {
                        gr.setFontSize(8);
                        gr.textout(pos.x, pos.y, 'white', ti.floodValue.toString());
                    }
                }
                if (x0 + x == this.mouseMapPos.x && y0 + y == this.mouseMapPos.y) {
                    TileManager.instance.drawTile(pos, 'tile-highlight', 0);
                }
                pos.x += tileSize;
            }
            pos0.y += tileSize;
            pos.assign(pos0);
        }
        gr.resetClip();
    }

    resetLastPath() {
        for (let pos of this.lastPath) {
            this.mapGet(pos.x, pos.y).tintColor = undefined
        }
        this.lastPath = [];
    }

    addToPath(x: number, y: number) {
        this.lastPath.push(new Pos(x, y));
    }

    updatePath() {
        if (this.lastPathPos.isEqual(this.mouseMapPos)) {
            return;
        }
        if (!this.mapPGet(this.mouseMapPos)) {
            return;
        }
        this.resetLastPath();
        let src = this.player.pos;
        this.lastPathSrc.assign(src);
        this.lastPathPos.assign(this.mouseMapPos);
        if (src.isEqual(this.lastPathPos)) {
            return;
        }
        let path = new ROT.Path.AStar(this.lastPathPos.x, this.lastPathPos.y, (x: number, y: number) => this.passabilityTest(x, y, this.lastPathSrc), { topology: 4 });
        path.compute(src.x, src.y, (x: number, y: number) => this.addToPath(x, y));
        for (let pos of this.lastPath) {
            this.mapGet(pos.x, pos.y).tintColor = 'cyan'
        }
        if(this.runMode) {
            this.runIdx = 1
        }
    }

    calcPath(from: Pos, to: Pos) {
        let rv: Pos[] = []
        let path = new ROT.Path.AStar(to.x, to.y, (x: number, y: number) => this.passabilityTest(x, y, from), { topology: 4 });
        path.compute(from.x, from.y, (x: number, y: number) => rv.push(new Pos(x, y)));
        return rv
    }

    passabilityTest(x: number, y: number, src: Pos) {
        if (src.x == x && src.y == y) {
            return true;
        }
        let ti = this.mapGet(x, y);
        return ti && ti.passable && !ti.hasBlockingEntity()
    }

    onMouseDown(e: MyMouseEvent) {
        this.dragStart = new Pos(e.x, e.y);
        this.offsetStart = this.offset.clone();
        this.mouseMoved = false;
        this.updateMapMousePos(e);
        this.centering = false;
    }

    onMouseUp(e: MyMouseEvent) {
        this.dragStart = null;
        if (!this.mouseMoved) {
            this.onClick(e);
        }
    }

    updateMapMousePos(e: MyMouseEvent) {
        if (this.debugTiles) {
            this.mouseMapPos.x = Math.floor((e.x) / tileFullSize);
            this.mouseMapPos.y = Math.floor((e.y) / tileFullSize);
        }
        else {
            this.mouseMapPos.x = Math.floor((this.offset.x + e.x) / tileSize);
            this.mouseMapPos.y = Math.floor((this.offset.y + e.y) / tileSize);
            this.updatePath();
        }
    }

    onMouseMove(e: MyMouseEvent) {
        this.mouseMoved = true;
        if (this.dragStart) {
            this.offset.x = this.offsetStart.x + (this.dragStart.x - e.x);
            this.offset.y = this.offsetStart.y + (this.dragStart.y - e.y);
            let tl = this.mapRect.pos.clone().mul(tileSize).sub(this.rect.size.toPos().div(2));
            let sz = this.mapRect.size.toPos().mul(tileSize).toSize();
            this.offset.clamp(new Rect(tl, sz));
        }
        this.updateMapMousePos(e);
    }

    onClick=(e: MyMouseEvent) => {
        if (this.lastPath.length) {
            if(e.original.button == 0) {
            let src = this.player.pos;
            let dst = this.lastPath[1];
            let dir = diffToDir(src.x, src.y, dst.x, dst.y);
            this.move(dir, true);
            this.lastPathPos.assign(src);
            this.updatePath();
            } else if (e.original.button == 2) {
                if(this.mouseMapPos.isEqual(this.player.pos)) {
                    this.showAbilities()
                }
                else {
                    this.runIdx = 1
                    this.runMode = true
                    this.runModeStep()
                }
            }
        }
        else if (e.original.button == 2) {
            if (this.mouseMapPos.isEqual(this.player.pos)) {
                this.showAbilities()
            }
        }
    }

    runModeStep() {
        if (this.runModeDir) {
            let dst = this.player.pos.clone().addDir(this.runDir)
            let ti = this.mapPGet(dst)
            if (ti.passable && !ti.hasBlockingEntity()) {
                this.move(this.runDir, true)
            }
            else {
                this.cancelRunMode()
            }
        }
        else {
            if (this.runIdx >= this.lastPath.length) {
                this.cancelRunMode()
                return
            }
            let src = this.player.pos;
            let dst = this.lastPath[this.runIdx];
            let dir = diffToDir(src.x, src.y, dst.x, dst.y);
            this.move(dir, true);
            ++this.runIdx
        }
    }

    cancelRunMode() {
        this.runMode = false
        this.runModeDir = false
        this.resetLastPath()
    }

    floodMap(from: Array<Pos>, maxDist: number = -1) {
        let dist = 0;
        let next: Array<Pos> = [];
        let pos = new Pos;
        ++this.floodSeq;
        while (from.length) {
            for (let pos0 of from) {
                let ti0 = this.mapPGet(pos0);
                console.log(`check ${ti0} at ${pos0.x},${pos0.y}`);
                ti0.floodSeq = this.floodSeq;
                ti0.floodValue = dist;
                for (let i = 0; i < 4; ++i) {
                    let x1 = pos0.x + dirX[i];
                    let y1 = pos0.y + dirY[i];
                    let ti = this.mapGet(x1, y1);
                    if (!ti || !ti.passable || ti.floodSeq == this.floodSeq ||
                        !ti0.conn[diffToDir(pos0.x, pos0.y, x1, y1)]) continue;
                    next.push(new Pos(x1, y1));
                }
            }
            ++dist;
            from = next;
            next = [];
            if (maxDist != -1 && dist > maxDist) break;
        }
    }

    activatePendingDirAbility(dir:DIR) {
        let target = new AbilityTarget
        target.dir = dir
        this.pendingAbility.activate(this.player, target)
        this.player.spendAbilityCose(this.pendingAbility)
        this.onPlayerAction()
    }

    activateAbility(a:Ability) {
        if(a.getTargetType()==AbilityTargetType.none) {
            a.activate(this.player)
            this.player.spendAbilityCose(a)
            this.onPlayerAction()
        }
        else if(a.getTargetType() == AbilityTargetType.direction){
            this.pendingAbility = a
            uiManager.showModal(new DirTargetSelector(this, this.player.pos, dir=>this.activatePendingDirAbility(dir)))
        }
    }

    showAbilities() {
        console.log('show abil')
        uiManager.showModal(new AbilityList(this.player, a=>this.activateAbility(a)))
    }
}
