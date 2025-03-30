const mongoose = require('mongoose')
const { serverInit, serverCleanup, stopServer } = require('~/test/setup')
const migration = require('@root/migrations/20250224153425-rename-resource-completion-status')

const COLLECTION_NAME = 'cooperation'

const cooperationWithOutdatedResources = [
  {
    sections: [
      {
        resources: [{ completionStatus: 'active' }, { name: 'resource1' }]
      }
    ]
  },
  {
    sections: [
      {
        resources: [{ completionStatus: 'completed' }, { completionStatus: 'active' }]
      }
    ]
  }
]

const cooperationWithUpdatedResources = [
  {
    sections: [
      {
        resources: [{ completionStatus: 'in progress' }, { completionStatus: 'completed' }]
      }
    ]
  }
]

describe('20250224153425-rename-resource-completion-status', () => {
  let server
  let db

  beforeAll(async () => {
    ;({ server } = await serverInit())
    db = mongoose.connection.db
  })

  afterEach(async () => await serverCleanup())

  afterAll(async () => {
    await stopServer(server)
  })

  test('should set completionStatus to "in progress" for resources with "active" or no completionStatus during up migration', async () => {
    const collection = db.collection(COLLECTION_NAME)

    await collection.insertMany(cooperationWithOutdatedResources)

    await migration.up(db)

    const updatedDocuments = await collection.find().toArray()

    const inProgressCount = updatedDocuments.flatMap((doc) =>
      doc.sections.flatMap((section) =>
        section.resources.filter((resource) => resource.completionStatus === 'in progress')
      )
    ).length

    const completedCount = updatedDocuments.flatMap((doc) =>
      doc.sections.flatMap((section) =>
        section.resources.filter((resource) => resource.completionStatus === 'completed')
      )
    ).length

    expect(inProgressCount).toBe(3)
    expect(completedCount).toBe(1)
  })

  test('should revert completionStatus to "active" for resources with "in progress" during down migration', async () => {
    const collection = db.collection(COLLECTION_NAME)

    await collection.insertMany(cooperationWithUpdatedResources)

    await migration.down(db)

    const updatedDocuments = await collection.find().toArray()

    const activeCount = updatedDocuments.flatMap((doc) =>
      doc.sections.flatMap((section) => section.resources.filter((resource) => resource.completionStatus === 'active'))
    ).length

    const completedCount = updatedDocuments.flatMap((doc) =>
      doc.sections.flatMap((section) =>
        section.resources.filter((resource) => resource.completionStatus === 'completed')
      )
    ).length

    expect(activeCount).toBe(1)
    expect(completedCount).toBe(1)
  })
})
