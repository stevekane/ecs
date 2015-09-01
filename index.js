'use strict'

import {v4 as UUID} from 'node-uuid'
import Pixi from 'pixi.js'
import {AABB, doesCollide} from './physics'
import {add, remove} from './utils'

const collides = (e) => !!e.aabb
const lessThan = (prop, a) => (b) => a[prop] < b[prop]
const both = (fn1, fn2) => (e) => fn1(e) && fn2(e)
const not = (e1) => (e2) => e1 !== e2
const isInstanceOf = (Ctor) => (e) => e instanceof Ctor

class Signal {
  constructor (value) {
    this.value = value
  }
}

class BaseClock extends Signal {
  constructor () {
    super()
    let offset = performance.now()

    Object.defineProperty(this, 'value', {
      get () { return performance.now() - offset  } 
    })
  }
}

class Diff extends Signal {
  constructor (signal) {
    super()
    this.last = signal.value

    Object.defineProperty(this, 'value', {
      get () { 
        let last = this.last
        let current = signal.value

        this.last = current
        return current - last
      }       
    })
  } 
}

class Card extends PIXI.Sprite {
  constructor (pos, imageName) {
    const texture = PIXI.Texture.fromImage(imageName)

    super(texture)
    this.id = UUID()
    this.position.x = pos.x
    this.position.y = pos.y
    this.anchor.x = 0.5
    this.anchor.y = 0.5
    this.colliding = false
    this.aabb = new AABB(
      {x: this.position.x, y: this.position.y},
      {x: 140, y: 190}
    )
  }
}

function updateAABBs (entity) {
  if (entity.aabb) {
    entity.aabb.position.x = entity.worldTransform.tx 
    entity.aabb.position.y = entity.worldTransform.ty
  } 
}

function crawlAnd (fn, node) {
  fn(node)
  for (let child of node.children) {
    crawlAnd(fn, child)
  }
}

function * findWhere (fn, node) {
  if (fn(node)) yield node
  for (let child of node.children) {
    yield* findWhere(fn, child) 
  }
}

function render () {
  requestAnimationFrame(render)
  renderer.render(root)
}

function update () {
  let {dT, baseClock} = gameState
   
  for (let card of findWhere(isInstanceOf(Card), root)) {
    card.scale.x = Math.sin(performance.now() / 100)
    card.scale.y = Math.sin(performance.now() / 1000)
  }
  for (let [p1, p2] of getColliderPairs(root)) {
    //console.log(p1.id, "hits", p2.id)
  }
  crawlAnd(updateAABBs, root)
}

function * getColliderPairs (entities) {
  for (let n1 of findWhere(collides, root)) {
    for (let n2 of findWhere(both(collides, not(n1)), root)) {
      if (doesCollide(n1.aabb, n2.aabb)) yield [n1, n2]    
    }
  }
}

const c = new Card({x: 100, y: 100}, 'sample-card.png')
const c2 = new Card({x: 150, y: 150}, 'sample-card.png')
const c3 = new Card({x: 300, y: 300}, 'sample-card.png')
const c4 = new Card({x: 0, y: 0}, 'sample-card.png')
const root = new PIXI.Container
const g2 = new PIXI.Container
const renderer = new PIXI.autoDetectRenderer(640, 480)
const baseClock = new BaseClock

const gameState = {
  baseClock: baseClock,
  dT: new Diff(baseClock),
  entities: [root, g2, c, c2, c3, c4],
}

document.body.appendChild(renderer.view)
root.addChild(c)
root.addChild(c2)
root.addChild(c3)
root.addChild(g2)
g2.addChild(c4)

render()
setInterval(update, 33)
