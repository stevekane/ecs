'use strict'

const tick = Date.now
var id = 0

function Clock (lastTime, thisTime) {
  this.lastTime = lastTime || 0
  this.thisTime = thisTime || 0
  this.dT = thisTime - lastTime
}

function Entity (position, radius, target) {
  this.id = id++
  this.position = position
  this.radius = radius
  this.target = target
  this.speed = 0.005
}

function collides (e) {
  return e.position && e.radius
}

function has (key) {
  return function (e) {
    return !!e[key] 
  }
}

function both (fn1, fn2) {
  return function (e) {
    return fn1(e) && fn2(e) 
  }
}

function not (e1) {
  return function (e2) {
    return e1 !== e2 
  }
}

function uniqueId (e1) {
  return function (e2) {
    return e2.id > e1.id 
  }
}

function greaterThan (prop, a) { 
  return function (b) { 
    return a[prop] > b[prop]
  }
}

function doesCollide (e1, e2) {
  const dx = e2.position.x - e1.position.x
  const dy = e2.position.y - e1.position.y
  const radii = e1.radius + e2.radius

  return (Math.pow(dx, 2) + Math.pow(dy, 2)) < Math.pow(radii, 2)
}

function * findWhere (predFn, list) {
  for (let item of list) {
    if (predFn(item)) yield item 
  } 
}

function * checkCollisions (clock, entities) {
  for (let n1 of findWhere(collides, entities)) {
    for (let n2 of findWhere(both(collides, greaterThan('id', n1)), entities)) {
      if (n1 !== n2 && doesCollide(n1, n2)) yield [n1, n2]    
    }
  }
}

function * handleCollisions (clock, entities) {
  while (true) {
    for (let pair of checkCollisions(clock, entities)) {
      console.log(pair[0].id, 'hit', pair[1].id) 
    }
    yield
  }
}

function * moveTo (clock, entities) {
  while (true) {
    let dT = clock.dT

    for (let mover of findWhere(has('target'), entities)) {
      let diffX = mover.target.x - mover.position.x
      let diffY = mover.target.y - mover.position.y
      let remainingDistSquared = Math.pow(diffX, 2) + Math.pow(diffY, 2)
      let dist = dT * mover.speed
      let dX = Math.cos(Math.atan2(diffY, diffX)) * dist
      let dY = Math.sin(Math.atan2(diffY, diffX)) * dist

      if (dist * dist > remainingDistSquared) {
        mover.position.x = mover.target.x 
        mover.position.y = mover.target.y
      } else {
        mover.position.x += dX
        mover.position.y += dY
      }
    } 
    yield
  }
}

function * tickClock (clock, startTime) {
  var offset = startTime

  while (true) {
    clock.lastTime = clock.thisTime
    clock.thisTime = tick() - offset
    clock.dT = clock.thisTime - clock.lastTime
    yield clock
  }
}

function update () {
  runTasks(tasks)
  console.log('break')
}

function render () {
  console.log('render')
}

function runTasks (tasks) {
  var i = 0
    
  while ( i < tasks.length ) {
    let task = tasks[i]
    let run = task.next() 

    if (run.done) tasks.splice(i, 1)
    else          i++
  }
}

const e1 = new Entity({x: 0, y: 0}, 5, {x: 10, y: 10})
const e2 = new Entity({x: 10, y: 10}, 5, {x: 0, y: 0})
const e3 = new Entity({x: -10, y: -20}, 5, e1.position)
const start = tick()
const game = {
  clock: new Clock(0, 0),
  entities: [e1, e2, e3]
}
const tasks = [
  tickClock(game.clock, start),
  moveTo(game.clock, game.entities),
  handleCollisions(game.clock, game.entities)
]

setInterval(update, 33)
