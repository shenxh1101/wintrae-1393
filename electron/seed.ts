import { loadDb, saveDb, getNextId } from './db'

export function seedSampleData() {
  const db = loadDb()

  if (db.books.length > 0) {
    return
  }

  const books = [
    { isbn: '9787020002207', barcode: 'B00001', title: '红楼梦', author: '曹雪芹', publisher: '人民文学出版社', publish_date: '2008-07-01', category: '古典文学', location_id: 1, shelf: 'A-01', total_copies: 3, available_copies: 3, description: '中国古典四大名著之首，以贾宝玉、林黛玉、薛宝钗的爱情婚姻悲剧为主线。' },
    { isbn: '9787020002214', barcode: 'B00002', title: '西游记', author: '吴承恩', publisher: '人民文学出版社', publish_date: '2010-10-01', category: '古典文学', location_id: 1, shelf: 'A-02', total_copies: 5, available_copies: 4, description: '明代神魔小说的巅峰之作，讲述唐僧师徒四人西天取经的故事。' },
    { isbn: '9787020002221', barcode: 'B00003', title: '三国演义', author: '罗贯中', publisher: '人民文学出版社', publish_date: '2009-01-01', category: '古典文学', location_id: 1, shelf: 'A-03', total_copies: 4, available_copies: 2, description: '中国第一部长篇章回体历史演义小说，描写了从东汉末年到西晋初年的历史风云。' },
    { isbn: '9787020002238', barcode: 'B00004', title: '水浒传', author: '施耐庵', publisher: '人民文学出版社', publish_date: '2011-05-01', category: '古典文学', location_id: 1, shelf: 'A-04', total_copies: 3, available_copies: 3, description: '以北宋末年宋江起义为主要故事背景的长篇小说。' },
    { isbn: '9787544270878', barcode: 'B00005', title: '活着', author: '余华', publisher: '作家出版社', publish_date: '2012-08-01', category: '当代文学', location_id: 1, shelf: 'B-01', total_copies: 6, available_copies: 5, description: '讲述了农村人福贵悲惨的人生遭遇。' },
    { isbn: '9787544253994', barcode: 'B00006', title: '百年孤独', author: '加西亚·马尔克斯', publisher: '南海出版公司', publish_date: '2011-06-01', category: '外国文学', location_id: 1, shelf: 'C-01', total_copies: 4, available_copies: 3, description: '魔幻现实主义文学的代表作，描写了布恩迪亚家族七代人的传奇故事。' },
    { isbn: '9787111213826', barcode: 'B00007', title: 'JavaScript高级程序设计', author: 'Nicholas C. Zakas', publisher: '机械工业出版社', publish_date: '2012-03-01', category: '计算机', location_id: 2, shelf: 'D-01', total_copies: 5, available_copies: 4, description: 'JavaScript技术经典著作，全面深入地介绍了JavaScript语言的核心概念。' },
    { isbn: '9787115352668', barcode: 'B00008', title: 'Python编程从入门到实践', author: 'Eric Matthes', publisher: '人民邮电出版社', publish_date: '2016-07-01', category: '计算机', location_id: 2, shelf: 'D-02', total_copies: 6, available_copies: 6, description: '一本针对所有层次的Python读者而作的Python入门书。' },
    { isbn: '9787302423287', barcode: 'B00009', title: '算法导论', author: 'Thomas H. Cormen', publisher: '清华大学出版社', publish_date: '2013-01-01', category: '计算机', location_id: 2, shelf: 'D-03', total_copies: 3, available_copies: 2, description: '计算机算法领域的经典教材，全面覆盖了算法理论的方方面面。' },
    { isbn: '9787544280907', barcode: 'B00010', title: '人类简史', author: '尤瓦尔·赫拉利', publisher: '中信出版社', publish_date: '2017-02-01', category: '历史', location_id: 2, shelf: 'E-01', total_copies: 5, available_copies: 4, description: '从认知革命、农业革命到科学革命，讲述人类的进化历史。' },
    { isbn: '9787550287686', barcode: 'B00011', title: '小王子', author: '安托万·德·圣-埃克苏佩里', publisher: '北京联合出版公司', publish_date: '2018-03-01', category: '儿童文学', location_id: 3, shelf: 'F-01', total_copies: 8, available_copies: 7, description: '一部充满诗意和哲理的童话，引导读者去思考生命的意义。' },
    { isbn: '9787532780303', barcode: 'B00012', title: '夏洛的网', author: 'E.B.怀特', publisher: '上海译文出版社', publish_date: '2014-08-01', category: '儿童文学', location_id: 3, shelf: 'F-02', total_copies: 6, available_copies: 6, description: '一个关于友谊与生命的动人故事。' },
    { isbn: '9787544258609', barcode: 'B00013', title: '解忧杂货店', author: '东野圭吾', publisher: '南海出版公司', publish_date: '2014-05-01', category: '悬疑', location_id: 4, shelf: 'G-01', total_copies: 7, available_copies: 5, description: '一个关于命运、爱与温柔的奇妙故事。' },
    { isbn: '9787544266928', barcode: 'B00014', title: '白夜行', author: '东野圭吾', publisher: '南海出版公司', publish_date: '2013-01-01', category: '悬疑', location_id: 4, shelf: 'G-02', total_copies: 5, available_copies: 3, description: '东野圭吾推理小说中的无冕之王。' },
    { isbn: '9787508648255', barcode: 'B00015', title: '经济学原理', author: 'N.格里高利·曼昆', publisher: '北京大学出版社', publish_date: '2015-06-01', category: '经济', location_id: 2, shelf: 'H-01', total_copies: 4, available_copies: 3, description: '经济学入门的经典教材。' },
    { isbn: '9787300164854', barcode: 'B00016', title: '心理学与生活', author: '理查德·格里格', publisher: '人民邮电出版社', publish_date: '2016-01-01', category: '心理学', location_id: 4, shelf: 'I-01', total_copies: 4, available_copies: 4, description: '心理学入门经典教材。' },
    { isbn: '9787115428028', barcode: 'B00017', title: '深度学习', author: 'Ian Goodfellow', publisher: '人民邮电出版社', publish_date: '2017-08-01', category: '计算机', location_id: 2, shelf: 'D-04', total_copies: 3, available_copies: 2, description: '深度学习领域的经典著作。' },
    { isbn: '9787508655567', barcode: 'B00018', title: '三体', author: '刘慈欣', publisher: '重庆出版社', publish_date: '2008-01-01', category: '科幻', location_id: 4, shelf: 'J-01', total_copies: 10, available_copies: 8, description: '中国科幻文学的里程碑之作。' },
    { isbn: '9787559610096', barcode: 'B00019', title: '时间简史', author: '史蒂芬·霍金', publisher: '湖南科学技术出版社', publish_date: '2018-01-01', category: '科普', location_id: 2, shelf: 'K-01', total_copies: 5, available_copies: 5, description: '探索宇宙起源与命运的科普经典。' },
    { isbn: '9787020102725', barcode: 'B00020', title: '围城', author: '钱锺书', publisher: '人民文学出版社', publish_date: '2018-03-01', category: '现代文学', location_id: 1, shelf: 'B-02', total_copies: 4, available_copies: 3, description: '现代文学的经典之作，讽刺小说的巅峰。' },
  ]

  const now = new Date().toISOString()

  for (const book of books) {
    const id = getNextId('books')
    db.books.push({
      id,
      isbn: book.isbn,
      barcode: book.barcode,
      title: book.title,
      author: book.author,
      publisher: book.publisher,
      publish_date: book.publish_date,
      category: book.category,
      location_id: book.location_id,
      shelf: book.shelf,
      status: 'available',
      description: book.description,
      total_copies: book.total_copies,
      available_copies: book.available_copies,
      created_at: now,
      updated_at: now,
    })
  }

  const readers = [
    { card_no: 'R00001', name: '张三', gender: '男', phone: '13800138001', email: 'zhangsan@example.com', address: '北京市朝阳区xxx街道1号', type: 'adult', max_borrow: 10, borrow_days: 30, status: 'active' },
    { card_no: 'R00002', name: '李四', gender: '女', phone: '13800138002', email: 'lisi@example.com', address: '北京市海淀区xxx街道2号', type: 'adult', max_borrow: 10, borrow_days: 30, status: 'active' },
    { card_no: 'R00003', name: '王五', gender: '男', phone: '13800138003', email: 'wangwu@example.com', address: '北京市西城区xxx街道3号', type: 'student', max_borrow: 15, borrow_days: 45, status: 'active' },
    { card_no: 'R00004', name: '赵六', gender: '女', phone: '13800138004', email: 'zhaoliu@example.com', address: '北京市东城区xxx街道4号', type: 'senior', max_borrow: 8, borrow_days: 60, status: 'active' },
    { card_no: 'R00005', name: '小明', gender: '男', phone: '13800138005', email: 'xiaoming@example.com', address: '北京市丰台区xxx街道5号', type: 'child', max_borrow: 5, borrow_days: 21, status: 'active' },
    { card_no: 'R00006', name: '小红', gender: '女', phone: '13800138006', email: 'xiaohong@example.com', address: '北京市石景山区xxx街道6号', type: 'child', max_borrow: 5, borrow_days: 21, status: 'active' },
    { card_no: 'R00007', name: '陈七', gender: '男', phone: '13800138007', email: 'chenqi@example.com', address: '北京市通州区xxx街道7号', type: 'adult', max_borrow: 10, borrow_days: 30, status: 'active' },
    { card_no: 'R00008', name: '刘八', gender: '女', phone: '13800138008', email: 'liuba@example.com', address: '北京市昌平区xxx街道8号', type: 'adult', max_borrow: 10, borrow_days: 30, status: 'inactive' },
    { card_no: 'R00009', name: '杨九', gender: '男', phone: '13800138009', email: 'yangjiu@example.com', address: '北京市大兴区xxx街道9号', type: 'student', max_borrow: 15, borrow_days: 45, status: 'active' },
    { card_no: 'R00010', name: '周十', gender: '女', phone: '13800138010', email: 'zhoushi@example.com', address: '北京市房山区xxx街道10号', type: 'senior', max_borrow: 8, borrow_days: 60, status: 'active' },
  ]

  for (const reader of readers) {
    const id = getNextId('readers')
    db.readers.push({
      id,
      card_no: reader.card_no,
      name: reader.name,
      gender: reader.gender,
      phone: reader.phone,
      email: reader.email,
      address: reader.address,
      type: reader.type,
      max_borrow: reader.max_borrow,
      borrow_days: reader.borrow_days,
      status: reader.status,
      register_date: now,
    })
  }

  saveDb()
}

export default seedSampleData
