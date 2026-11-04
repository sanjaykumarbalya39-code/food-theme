const modal=document.querySelector('#modal'),content=document.querySelector('#modal-content');
function openModal(html){content.innerHTML=html;modal.showModal()}
document.querySelector('.close').addEventListener('click',()=>modal.close());modal.addEventListener('click',e=>{if(e.target===modal){const rect=modal.getBoundingClientRect();if(e.clientX<rect.left||e.clientX>rect.right||e.clientY<rect.top||e.clientY>rect.bottom)modal.close()}});
document.querySelectorAll('[data-auth]').forEach(button=>button.addEventListener('click',()=>{window.location.href=button.dataset.auth==='Sign Up'?'signup.html':'login.html'}));
document.querySelectorAll('[data-info]').forEach(button=>button.addEventListener('click',e=>{e.preventDefault();openModal(`<h2>${button.dataset.info}</h2><p>This is the Stackly design preview. More information will be available when the service launches.</p>`)}));
const locationSelect=document.querySelector('#location-select');
const languageSelect=document.querySelector('#language-select');
function savePreference(key,value){try{localStorage.setItem(key,value)}catch{}}
function showNotice(message){const toast=document.querySelector('.toast');toast.textContent=message;toast.classList.add('show');clearTimeout(showNotice.timer);showNotice.timer=setTimeout(()=>toast.classList.remove('show'),3500)}
locationSelect.addEventListener('change',()=>{savePreference('faaaahh-location',locationSelect.value);showNotice(locationSelect.value?`Location set to ${locationSelect.value}. Restaurant listings are preview data.`:'Choose your location.');});
const headerLanguages={
 en:{nav:['Home','Restaurants','Dine In','Explore Menu','About','Contact','FAQ'],login:'Login',cart:'Add to Cart',location:'Location'},
 hi:{nav:['\u0939\u094b\u092e','\u0930\u0947\u0938\u094d\u091f\u094b\u0930\u0947\u0902\u091f','\u0921\u093e\u0907\u0928 \u0907\u0928','\u092e\u0947\u0928\u094d\u092f\u0942','\u0939\u092e\u093e\u0930\u0947 \u092c\u093e\u0930\u0947 \u092e\u0947\u0902','\u0938\u0902\u092a\u0930\u094d\u0915','\u0938\u0935\u093e\u0932'],login:'\u0932\u0949\u0917\u093f\u0928',cart:'\u0915\u093e\u0930\u094d\u091f',location:'\u0938\u094d\u0925\u093e\u0928'},
 kn:{nav:['\u0cae\u0cc1\u0c96\u0caa\u0cc1\u0c9f','\u0cb0\u0cc6\u0cb8\u0ccd\u0c9f\u0ccb\u0cb0\u0cc6\u0c82\u0c9f\u0ccd','\u0c8a\u0c9f','\u0cae\u0cc6\u0ca8\u0cc1','\u0ca8\u0cae\u0ccd\u0cae \u0cac\u0c97\u0ccd\u0c97\u0cc6','\u0cb8\u0c82\u0caa\u0cb0\u0ccd\u0c95','\u0caa\u0ccd\u0cb0\u0cb6\u0ccd\u0ca8\u0cc6\u0c97\u0cb3\u0cc1'],login:'\u0cb2\u0cbe\u0c97\u0cbf\u0ca8\u0ccd',cart:'\u0c95\u0cbe\u0cb0\u0ccd\u0c9f\u0ccd',location:'\u0cb8\u0ccd\u0ca5\u0cb3'}
};
function applyHeaderLanguage(code){const labels=headerLanguages[code]||headerLanguages.en;document.querySelectorAll('.header nav a').forEach((link,i)=>{link.textContent=labels.nav[i];link.lang=code});const login=document.querySelector('.header-actions .login .control-label');login.textContent=labels.login;login.lang=code;const cartLabel=document.querySelector('#cart-button span');cartLabel.textContent=labels.cart;cartLabel.lang=code;locationSelect.options[0].textContent=labels.location;}
languageSelect.addEventListener('change',()=>{applyHeaderLanguage(languageSelect.value);savePreference('faaaahh-language',languageSelect.value);showNotice('Header language updated. Full page translation is coming soon.');});
try{const savedLocation=localStorage.getItem('faaaahh-location');if([...locationSelect.options].some(o=>o.value===savedLocation))locationSelect.value=savedLocation;const savedLanguage=localStorage.getItem('faaaahh-language');if(headerLanguages[savedLanguage]){languageSelect.value=savedLanguage;applyHeaderLanguage(savedLanguage)}}catch{}
if('IntersectionObserver' in window){document.documentElement.classList.add('js-motion');const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('visible');observer.unobserve(entry.target)}}),{threshold:.12});document.querySelectorAll('.reveal').forEach(el=>observer.observe(el))}

const contactForm=document.querySelector('#contact-form'),topicSelect=document.querySelector('#enquiry-topic'),messageInput=contactForm.elements.message,preview=document.querySelector('#message-preview'),prepared=document.querySelector('#prepared-message'),formStatus=document.querySelector('.contact-status');
function buildEnquiry(data){return `STACKLY / ENQUIRY DRAFT

Topic: ${data.topic.trim()}
Name: ${data.name.trim()}
Email: ${data.email.trim()}
Subject: ${data.subject.trim()}

${data.message.trim()}

Prepared locally. This message has not been sent.`}
document.querySelectorAll('[data-topic]').forEach(button=>button.addEventListener('click',()=>{topicSelect.value=button.dataset.topic;contactForm.hidden=false;preview.hidden=true;formStatus.textContent='';document.querySelector('#enquiry').scrollIntoView({behavior:'smooth'});topicSelect.focus({preventScroll:true})}));
messageInput.addEventListener('input',()=>{messageInput.setCustomValidity('');document.querySelector('#message-count').textContent=`${messageInput.value.length.toLocaleString('en-IN')} / 2,000`});
contactForm.addEventListener('submit',e=>{e.preventDefault();if(messageInput.value.trim().length<20){messageInput.setCustomValidity('Please include at least 20 characters of message text.');messageInput.reportValidity();return}for(const key of ['name','subject']){const field=contactForm.elements[key];field.setCustomValidity(field.value.trim()?'':'Please enter a value.');if(!field.checkValidity()){field.reportValidity();return}}prepared.textContent=buildEnquiry(Object.fromEntries(new FormData(contactForm)));contactForm.hidden=true;preview.hidden=false;formStatus.textContent='Your draft is ready. Nothing has been sent.';document.querySelector('#copy-message').focus()});
for(const key of ['name','subject'])contactForm.elements[key].addEventListener('input',()=>contactForm.elements[key].setCustomValidity(''));
document.querySelector('#edit-message').addEventListener('click',()=>{contactForm.hidden=false;preview.hidden=true;formStatus.textContent='';messageInput.focus()});
document.querySelector('#clear-message').addEventListener('click',()=>{contactForm.reset();prepared.textContent='';preview.hidden=true;contactForm.hidden=false;document.querySelector('#message-count').textContent='0 / 2,000';formStatus.textContent='Your enquiry details have been cleared.';contactForm.elements.name.focus()});
document.querySelector('#copy-message').addEventListener('click',async()=>{try{await navigator.clipboard.writeText(prepared.textContent);formStatus.textContent='Draft copied. Nothing has been sent.'}catch{formStatus.textContent='Copy is unavailable in this browser. Select the draft text to copy it, or download the text file.'}});
document.querySelector('#download-message').addEventListener('click',()=>{const blob=new Blob([prepared.textContent],{type:'text/plain;charset=utf-8'}),url=URL.createObjectURL(blob),link=document.createElement('a');link.href=url;link.download='stackly-enquiry.txt';document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);formStatus.textContent='Draft download requested. Nothing has been sent.'});
