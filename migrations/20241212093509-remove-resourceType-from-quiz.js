module.exports = {
  async up(db) {
    const quizCollection = db.collection('quizzes')
    const cooperationsCollection = db.collection('cooperation')

    const quizzes = await quizCollection.find({}).toArray()
    for (const quiz of quizzes) {
      if (quiz.resourceType) {
        await cooperationsCollection.updateMany(
          { 'sections.resources.resource': quiz._id },
          { $set: { 'sections.$[section].resources.$[res].resourceType': quiz.resourceType } },
          {
            arrayFilters: [{ 'section.resources.resource': quiz._id }, { 'res.resource': quiz._id }]
          }
        )
      }
    }
    await quizCollection.updateMany({}, { $unset: { resourceType: '' } })
  },

  async down(db) {
    const quizCollection = db.collection('quizzes')
    const cooperationsCollection = db.collection('cooperation')
    await cooperationsCollection.updateMany(
      { 'sections.resources.resource': { $exists: true } },
      { $unset: { 'sections.$[].resources.$[].resourceType': '' } }
    )
    await quizCollection.updateMany({}, { $set: { resourceType: 'quiz' } })
  }
}
