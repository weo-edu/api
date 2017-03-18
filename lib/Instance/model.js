/**
 * Imports
 */

const Share = require('lib/Share')

/**
 * Instance model
 */

function grade (share, inst) {
  const [points, max] = share.object.attachments
    .reduce((scores, att) => {
      if (!att.points || !att.points.max || att.poll) return scores

      const resp = inst.responses[att._id] || {}

      return [
        scores[0] + (resp.score || 0) * (att.points.max || 0),
        scores[1] + (att.points.max || 0)
      ]
    }, [0, 0])

  return points / (max || 1)
}

function isAutoGradable (question) {
  return question.objectType === 'question'
    && !question.poll
    && question.attachments
    && question.attachments.some(att => att.correctAnswer.length)
}

function gradeQuestion (question, response) {
  const normalizedResponse = response.map((r = '') => r.trim())

  return question.attachments.every(sub => {
    if (sub.objectType === 'choice') {
      const contains = normalizedResponse.indexOf(sub._id.toString()) !== -1
      return sub.correctAnswer.length ? contains : !contains
    } else if (sub.objectType === 'shortAnswer') {
      return sub.correctAnswer.some(answer => {
        answer = normalizeAnswer(answer, sub.caseSensitive)
        if (!answer) return false
        return normalizedResponse.some(resp => {
          return normalizeAnswer(resp, sub.caseSensitive) === answer
        })
      })
    }
  })
}

function normalizeAnswer (answer, caseSensitive) {
  answer = answer.trim()
  if (! caseSensitive) answer = answer.toLowerCase()

  return answer.replace(/\s+/g, ' ')
}

function setResponse (inst, id, prop, val) {
  inst.set(`responses.${id}.${prop}`, val)
  inst.markModified('responses')
  inst.markModified(`responses.${id}`)
  inst.markModified(`responses.${id}.${prop}`)
}

/**
 * Exports
 */

module.exports = {
  grade,
  isAutoGradable,
  gradeQuestion,
  setResponse
}
