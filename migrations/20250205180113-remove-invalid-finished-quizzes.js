const { mapToId } = require('../src/utils/mapToId')

module.exports = {
  async up(db) {
    const collection = db.collection('finishedquizzes')

    const invalidFinishedQuizzes = await collection.find({ cooperation: { $exists: false } }).toArray()

    if (invalidFinishedQuizzes.length === 0) {
      console.log('No invalid finished quizzes found.')
      return
    }

    await collection.deleteMany({ _id: { $in: mapToId(invalidFinishedQuizzes) } })
  },

  async down() {}
}
