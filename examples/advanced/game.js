const OPS = ['w', 's', 'a', 'd']
const NEIBOR = {
  empty: 0,
  exit: 1,
  wall: 2,
  hurt: 3,
  heart: 4
}
let X, Y
let STATUS = {
  lostLife: 0,
  win: false
}

function getNeibors(x, y) {
  let w, s, a, d
  if (x === 0) {
    switch (y) {
      case 0:
        w = s = d = a = NEIBOR.wall
        break;
      case 1:
        w = a = NEIBOR.wall
        s = NEIBOR.empty
        d = NEIBOR.hurt
        break;
      case 2:
        w = NEIBOR.heart
        s = NEIBOR.hurt
        a = NEIBOR.wall
        d = NEIBOR.empty
        break;
      case 3:
        w = d = NEIBOR.empty
        s = NEIBOR.hurt
        a = NEIBOR.wall
        break;
      case 4:
        w = NEIBOR.hurt
        s = a = NEIBOR.wall
        d = NEIBOR.empty
        break;
    }
  } else if (x === 1) {
    switch (y) {
      case 0:
        w = s = NEIBOR.wall
        d = NEIBOR.empty
        a = NEIBOR.exit
        break;
      case 1:
        w = NEIBOR.wall
        a = NEIBOR.heart
        d = s = NEIBOR.empty
        break;
      case 2:
        w = NEIBOR.hurt
        s = a = d = NEIBOR.empty
        break;
      case 3:
        w = s = NEIBOR.empty
        a = NEIBOR.hurt
        d = NEIBOR.wall
        break;
      case 4:
        w = d = NEIBOR.empty
        a = NEIBOR.hurt
        s = NEIBOR.wall
        break;
    }
  } else if (x === 2) {
    switch (y) {
      case 0:
        w = d = NEIBOR.wall
        a = s = NEIBOR.empty
        break;
      case 1:
        w = s = NEIBOR.empty
        a = NEIBOR.hurt
        d = NEIBOR.wall
        break;
      case 2:
        w = a = NEIBOR.empty
        s = d = NEIBOR.wall
        break;
      case 3:
        w = a = d = NEIBOR.wall
        s = NEIBOR.empty
        break;
      case 4:
        w = a = NEIBOR.empty
        s = d = NEIBOR.wall
        break;
    }
  }
  return {
    w,
    s,
    a,
    d
  }
}

module.exports = function runOps(ops, cx, cy) {
  X = cx
  Y = cy
  STATUS = {
    lostLife: 0,
    win: false
  }
  ops = ops.split('')
  for (let i = 0; i < ops.length; i++) {
    if (!OPS.includes(ops[i])) continue
    if (OPS.indexOf(ops[i]) > -1) {
      move(ops[i])
    } else {
      return false
    }
  }
  return {
    cx: X,
    cy: Y,
    ...STATUS
  }
}

function move(direction) {
  // console.log('direction: ', direction)
  let neibors = getNeibors(X, Y)
  // console.log('neibors: ', neibors)
  let moveForward = false
  switch (neibors[direction]) {
    case NEIBOR.empty:
      moveForward = true
      break;
    case NEIBOR.hurt:
      moveForward = true
      STATUS.lostLife += 1
      break;
    case NEIBOR.heart:
      moveForward = true
      STATUS.lostLife -= 1
      break;
    case NEIBOR.exit:
      STATUS.win = true
      break;
    case NEIBOR.wall:
      moveForward = false
      break;
  }
  // console.log('moveForward', moveForward)
  if (moveForward) {
    if (direction === 'w') {
      Y = Y - 1
    } else if (direction === 's') {
      Y = Y + 1
    } else if (direction === 'a') {
      X = X - 1
    } else if (direction === 'd') {
      X = X + 1
    }
  }
  // console.log(X, Y)
}
