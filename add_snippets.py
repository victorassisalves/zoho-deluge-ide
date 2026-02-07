import re

with open('ide.html', 'r') as f:
    html = f.read()

snippets_html = """
                <!-- Snippets View -->
                <div id="view-snippets" class="view-content">
                    <h4>Deluge Snippets</h4>
                    <div class="snippets-container" style="font-size:12px;">
                        <div class="snippet-group">
                            <h5>Condition</h5>
                            <div class="snippet-btn" data-snippet="if">if</div>
                            <div class="snippet-btn" data-snippet="else if">else if</div>
                            <div class="snippet-btn" data-snippet="else">else</div>
                            <div class="snippet-btn" data-snippet="conditional if">conditional if</div>
                        </div>
                        <div class="snippet-group">
                            <h5>Data Access</h5>
                            <div class="snippet-btn" data-snippet="insert">add record</div>
                            <div class="snippet-btn" data-snippet="fetch">fetch records</div>
                            <div class="snippet-btn" data-snippet="aggregate">aggregate records</div>
                            <div class="snippet-btn" data-snippet="update">update record</div>
                            <div class="snippet-btn" data-snippet="for each">for each record</div>
                            <div class="snippet-btn" data-snippet="delete">delete records</div>
                        </div>
                        <div class="snippet-group">
                            <h5>List Manipulation</h5>
                            <div class="snippet-btn" data-snippet="list">create list</div>
                            <div class="snippet-btn" data-snippet="add">add</div>
                            <div class="snippet-btn" data-snippet="remove">remove index</div>
                            <div class="snippet-btn" data-snippet="clear">clear list</div>
                            <div class="snippet-btn" data-snippet="sort">sort list</div>
                        </div>
                        <div class="snippet-group">
                            <h5>Map Manipulation</h5>
                            <div class="snippet-btn" data-snippet="map">create map</div>
                            <div class="snippet-btn" data-snippet="put">put</div>
                            <div class="snippet-btn" data-snippet="remove_key">remove key</div>
                            <div class="snippet-btn" data-snippet="clear_map">clear map</div>
                        </div>
                        <div class="snippet-group">
                            <h5>Miscellaneous</h5>
                            <div class="snippet-btn" data-snippet="variable">set variable</div>
                            <div class="snippet-btn" data-snippet="function">call function</div>
                            <div class="snippet-btn" data-snippet="mail">send mail</div>
                            <div class="snippet-btn" data-snippet="info">info</div>
                        </div>
                    </div>
                </div>
"""

html = html.replace('<div id="view-zoho-apis" class="view-content">', snippets_html + '                <div id="view-zoho-apis" class="view-content">')

with open('ide.html', 'w') as f:
    f.write(html)

with open('ide.css', 'a') as f:
    f.write("""
/* Snippet Styles */
.snippet-group h5 {
    margin: 15px 0 8px 0;
    color: var(--accent-color);
    border-bottom: 1px solid #333;
    padding-bottom: 2px;
    font-size: 11px;
}
.snippet-btn {
    background: #252526;
    border: 1px dashed #444;
    padding: 6px 10px;
    margin-bottom: 5px;
    cursor: pointer;
    border-radius: 3px;
    font-size: 12px;
    transition: all 0.2s;
}
.snippet-btn:hover {
    border-color: var(--accent-color);
    background: #2d2d30;
}
""")
