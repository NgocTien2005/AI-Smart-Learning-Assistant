import test from 'node:test'
import assert from 'node:assert/strict'
import { validateDemoArguments } from '../scripts/demo-seed/target.mjs'
import { buildDataset } from '../scripts/demo-seed/dataset.mjs'
import { validateManifest } from '../scripts/demo-seed/seed.mjs'
import { createPracticeQuestions } from '../src/utils/studyQuiz.js'
import { readFile } from 'node:fs/promises'
import { processDocument } from '../src/services/documentProcessing.js'

test('demo seed refuses missing, nonlocal,8081, mixed-mode and non-private development apply targets', () => {
  for (const args of [[], ['--dry-run'], ['--project','ai-smart-learning-assistant','--api','http://localhost:8081/api','--dry-run'], ['--project','production','--api','http://localhost:8080/api','--dry-run'], ['--project','ai-smart-learning-assistant','--api','https://example.com/api','--dry-run'], ['--project','ai-smart-learning-assistant','--api','http://localhost:8080/api','--apply'], ['--project','ai-smart-learning-assistant','--api','http://localhost:8080/api','--dry-run','--apply']]) assert.throws(() => validateDemoArguments(args, { isTTY: false }))
  assert.equal(validateDemoArguments(['--project','ai-smart-learning-assistant','--api','http://localhost:8080/api','--dry-run'], { isTTY: false }).mode, 'dry-run')
  assert.equal(validateDemoArguments(['--project','lumina-acceptance-ci-demo-fixture','--api','http://127.0.0.1:19001/api','--apply','--acceptance'], { isTTY: false }).mode, 'apply')
})

test('demo inventory contains original useful Vietnamese lessons and correct role/material coverage', () => {
  const data = buildDataset()
  assert.equal(data.users.filter(u => u.role === 'ADMIN').length, 1)
  assert.equal(data.users.filter(u => u.role === 'INSTRUCTOR').length, 4)
  assert.equal(data.users.filter(u => u.role === 'STUDENT' && u.isActive).length, 12)
  assert.equal(data.courses.length, 8)
  assert.equal(new Set(data.users.map(u => u.email)).size, data.users.length)
  assert.ok(data.users.every(u => u.email.endsWith('.invalid') && !('password' in u)))
  const formats = new Set()
  const content = new Set()
  for (const course of data.courses) {
    assert.equal(course.lessons.length, 6)
    for (const lesson of course.lessons) {
      assert.ok(lesson.content.length >= 600)
      assert.match(lesson.content, /Mục tiêu/)
      assert.match(lesson.content, /Ví dụ/)
      assert.match(lesson.content, /Thực hành/)
      assert.equal(content.has(lesson.content), false)
      content.add(lesson.content)
      const quiz = createPracticeQuestions(lesson.content, 4)
      assert.equal(quiz.error, undefined, lesson.title)
      assert.equal(quiz.actualCount, 4)
      if (lesson.document) formats.add(lesson.document.kind)
    }
  }
  assert.equal(content.size, 48)
  assert.deepEqual([...formats].sort(), ['csv','md','pdf','txt'])
})

test('ownership registry rejects unproven IDs, namespace drift and secret-bearing metadata', () => {
  for (const data of [null, {}, { datasetId:'other',users:[] }, { datasetId:'lumina-demo-v2',version:2,users:[{id:1,email:'real@example.com',role:'ADMIN'}] }, { datasetId:'lumina-demo-v2',version:2,users:[],password:'must-not-be-stored' }]) assert.throws(() => validateManifest(data))
})

test('original demo PDF handouts have readable Vietnamese text layers and supported source content', async () => {
  for (let index=1;index<=2;index++) {
    const buffer = await readFile(new URL(`../scripts/demo-seed/documents/handout-${index}.pdf`,import.meta.url))
    const result = await processDocument({name:'handout.pdf',mimetype:'application/pdf',buffer})
    assert.equal(result.status,'SUCCESS')
    assert.match(result.text,/Thực hành/)
    assert.ok(result.text.length>1000)
    assert.ok(result.pages.length>=1)
    assert.equal(createPracticeQuestions(result.text,4).actualCount,4)
  }
})
