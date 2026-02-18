// MongoDB Initialization Script
// This script runs when MongoDB container starts for the first time

// Switch to vista database
db = db.getSiblingDB('vista');

// Create collections with basic validation
db.createCollection('users', {
    validator: {
        $jsonSchema: {
            bsonType: 'object',
            required: ['email', 'name', 'role'],
            properties: {
                email: {
                    bsonType: 'string',
                    pattern: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$',
                    description: 'must be a valid email address'
                },
                name: {
                    bsonType: 'string',
                    description: 'must be a string'
                },
                role: {
                    enum: ['admin', 'faculty', 'student', 'coordinator'],
                    description: 'must be one of the allowed roles'
                }
            }
        }
    }
});

db.createCollection('projects');
db.createCollection('panels');
db.createCollection('reviews');
db.createCollection('schools');
db.createCollection('programs');
db.createCollection('academicyears');

// Create indexes for performance
db.users.createIndex({ email: 1 }, { unique: true });
db.users.createIndex({ employeeId: 1 }, { unique: true, sparse: true });
db.users.createIndex({ registrationNumber: 1 }, { unique: true, sparse: true });
db.users.createIndex({ role: 1 });

db.projects.createIndex({ students: 1 });
db.projects.createIndex({ guide: 1 });
db.projects.createIndex({ school: 1 });
db.projects.createIndex({ program: 1 });
db.projects.createIndex({ academicYear: 1 });

db.panels.createIndex({ members: 1 });
db.panels.createIndex({ school: 1 });
db.panels.createIndex({ program: 1 });
db.panels.createIndex({ academicYear: 1 });

db.reviews.createIndex({ project: 1 });
db.reviews.createIndex({ panel: 1 });
db.reviews.createIndex({ reviewer: 1 });

print('MongoDB initialized successfully');
print('Database: vista');
print('Collections created with indexes');
