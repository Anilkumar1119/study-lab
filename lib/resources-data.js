export const fields = [
  ['Mathematics & statistics',['Arithmetic','Geometry','Trigonometry','Calculus','Linear algebra','Probability','Statistics','Discrete mathematics']],
  ['Physical & earth sciences',['Physics','Chemistry','Astronomy','Geology','Meteorology','Oceanography','Environmental science']],
  ['Life sciences & agriculture',['Biology','Genetics','Microbiology','Botany','Zoology','Ecology','Agriculture','Veterinary science']],
  ['Health & medicine',['Anatomy','Physiology','Medicine','Nursing','Pharmacy','Public health','Nutrition','Sports science']],
  ['Engineering & technology',['Civil engineering','Mechanical engineering','Electrical engineering','Electronics','Chemical engineering','Architecture','Robotics','Renewable energy']],
  ['Computing & data',['Computer science','Programming','Algorithms','Operating systems','Databases','Networking','Cybersecurity','Artificial intelligence','Data science']],
  ['Languages & literature',['English','Hindi','Kannada','Sanskrit','French','Spanish','Linguistics','Literature','Writing']],
  ['Humanities & arts',['History','Philosophy','Religious studies','Art history','Design','Music','Theatre','Film','Photography']],
  ['Social sciences & law',['Geography','Psychology','Sociology','Anthropology','Political science','Civics','Law','Education']],
  ['Business & economics',['Economics','Accounting','Finance','Marketing','Management','Entrepreneurship','International trade']],
  ['Trades & practical skills',['Carpentry','Electrical trades','Automotive technology','Culinary arts','Textiles','Career skills','Study skills']]
];

export const types = [
  ['all','All resource types'],['books','Books & textbooks'],['courses','Courses'],['notes','Notes & learning guides'],
  ['reference','Reference articles'],['research','Research papers'],['videos','Videos & lectures'],
  ['practice','Practice, worksheets & past papers'],['simulations','Simulations & labs'],['teaching','Teaching materials']
];

const searchLink = (base, parameter, term) => {
  const url = new URL(base);
  url.searchParams.set(parameter, term);
  return url.href;
};

const providers = [
  ['MIT OpenCourseWare','courses', 'https://ocw.mit.edu/course-lists/most-popular-courses/', 'ocw.mit.edu', 'course'],
  ['SWAYAM','courses','https://swayam.gov.in/search_courses','swayam.gov.in','course'],
  ['NCERT Textbooks','books','https://ncert.nic.in/textbook.php','ncert.nic.in','textbook'],
  ['National Digital Library of India','books','https://ndl.iitkgp.ac.in/','ndl.iitkgp.ac.in','book'],
  ['OER Commons','notes','https://oercommons.org/','oercommons.org','study guide'],
  ['YouTube','videos','https://www.youtube.com/education',null,'lecture'],
  ['Khan Academy','practice','https://www.khanacademy.org/','khanacademy.org','exercise'],
  ['Open worksheets and past papers','practice','https://oercommons.org/',null,'(worksheet OR "past paper" OR "previous year question paper")'],
  ['PhET','simulations','https://phet.colorado.edu/en/simulations/browse','phet.colorado.edu','simulation'],
  ['Virtual Labs','simulations','https://www.vlab.co.in/','vlab.co.in','lab'],
  ['Library of Congress','teaching','https://www.loc.gov/programs/teachers/classroom-materials/primary-source-sets/','loc.gov','classroom materials'],
  ['OER Commons lesson plans','teaching','https://oercommons.org/','oercommons.org','lesson plan'],
  ['Google Scholar','research','https://scholar.google.com/',null,''],
  ['Open Library catalog','books','https://openlibrary.org/',null,''],
  ['Britannica','reference','https://www.britannica.com/','britannica.com','']
];

export function sourceLinks(term, type) {
  const selection = providers.filter(([, kind]) => type === 'all' || kind === type);
  const links = selection.map(([name, kind, home, domain, suffix]) => {
    if (!term) return { name, kind, url: home, label: 'Browse source' };
    if (name === 'YouTube') return { name, kind, url: searchLink('https://www.youtube.com/results','search_query',term + ' lecture'), label: 'Search YouTube' };
    if (name === 'Google Scholar') return { name, kind, url: searchLink(home,'q',term), label: 'Search Google Scholar' };
    if (name === 'Open Library catalog') return { name, kind, url: searchLink('https://openlibrary.org/search','q',term), label: 'Search Open Library' };
    const query = [term, suffix, domain && 'site:' + domain].filter(Boolean).join(' ');
    return { name, kind, url: searchLink('https://www.google.com/search','q',query), label: domain ? 'Search this source' : 'Search the web' };
  });
  if (!term) return links;
  const qualifiers = { all: '(course OR textbook OR tutorial OR worksheet OR lecture)', books: '(book OR textbook)', courses: 'course', notes: 'study notes', reference: 'reference', research: 'research paper', videos: 'lecture video', practice: '(worksheet OR exam OR practice)', simulations: '(simulation OR virtual lab)', teaching: 'lesson plan' };
  links.unshift({ name: 'All education sites', kind: type, url: searchLink('https://www.google.com/search','q',term + ' ' + qualifiers[type]), label: 'Search the education web' });
  return links;
}
