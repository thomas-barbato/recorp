
function generate_sector(background, sector, npc, pc) {
    let sector_html = document.querySelector('html')
    sector_html.classList.add('hidden');
    add_background(background);
    add_foreground(sector);
    add_npc(npc);
    add_pc(pc);
    sector_html.classList.remove('hidden');
}
