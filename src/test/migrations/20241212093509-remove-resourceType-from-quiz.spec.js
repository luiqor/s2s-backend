const { MongoClient, ObjectId } = require('mongodb')
const { up, down } = require('@root/migrations/20241212093509-remove-resourceType-from-quiz')

require('~/initialization/envSetup')
const {
  config: { MONGODB_URL }
} = require('~/configs/config')

const quizCollectionName = 'quizzes'
const cooperationCollectionName = 'cooperation'

const url = MONGODB_URL.slice(0, MONGODB_URL.lastIndexOf('/'))
const databaseName = MONGODB_URL.slice(MONGODB_URL.lastIndexOf('/') + 1)

describe('20241203085442-remove-resource-type-from-quizzes', () => {
  let client, database

  beforeAll(async () => {
    client = new MongoClient(url)
    database = client.db(databaseName)
    await client.connect()
  })

  afterAll(async () => {
    await up(database)
    await client.close()
  })

  test('should remove resourceType from quizzes on migrate up', async () => {
    await database.collection(quizCollectionName).insertOne({
      _id: ObjectId(),
      resourceType: 'quiz'
    })

    await up(database)

    const quiz = await database.collection(quizCollectionName).findOne({ resourceType: 'quiz' })
    expect(quiz).toBeNull()
  })

  test('should update cooperation documents with correct resourceType removal', async () => {
    const quizId = (
      await database.collection(quizCollectionName).insertOne({
        _id: ObjectId(),
        resourceType: 'quiz'
      })
    ).insertedId

    await database.collection(cooperationCollectionName).insertOne({
      sections: [
        {
          resources: [{ resource: quizId, resourceType: 'quiz' }]
        }
      ]
    })

    await up(database)
    const cooperation = await database.collection(cooperationCollectionName).findOne({
      'sections.resources.resource': quizId
    })
    const quiz = await database.collection(quizCollectionName).findOne({
      _id: quizId
    })

    expect(quiz.resourceType).toBeUndefined()

    expect(cooperation.sections[0].resources[0].resourceType).toBe('quiz')
  })

  test('should restore resourceType during migrate down', async () => {
    const quizId = ObjectId()
    await database.collection(quizCollectionName).insertOne({
      _id: quizId
    })

    await down(database)

    const quiz = await database.collection(quizCollectionName).findOne({ _id: quizId })
    expect(quiz.resourceType).toBe('quiz')
  })
})
