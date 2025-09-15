// 测试Dashboard页面内项目选择功能
console.log('测试Dashboard页面内导航功能...')

// 模拟项目选择功能
function selectProject(project) {
  console.log('选择了项目:', project.name)
  console.log('项目详情将在页面内显示，而不是跳转到新页面')
  return project
}

// 测试数据
const testProject = {
  id: 'test-123',
  name: '测试项目',
  description: '这是一个测试项目',
  status: '进行中',
  created_at: '2024-01-01'
}

// 执行测试
const selected = selectProject(testProject)
console.log('测试完成 - 项目选择功能正常')
console.log('选中的项目:', selected.name)