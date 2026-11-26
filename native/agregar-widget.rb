# Agrega al proyecto de Xcode que genera Capacitor:
#   1. el puente DescansoPlugin (para que la app pueda pedir la tarjeta del descanso), y
#   2. el widget MiGymWidget, que dibuja esa tarjeta en la pantalla de bloqueo.
# Corre después de "npx cap sync ios", porque ese paso reescribe capacitor.config.json.
require 'xcodeproj'
require 'json'
require 'fileutils'

aqui = File.expand_path(__dir__)
dir = File.join(aqui, '..', 'ios', 'App')
fuentes = aqui

# Capacitor registra solo las clases que aparecen en esta lista.
cfg = File.join(dir, 'App', 'capacitor.config.json')
j = JSON.parse(File.read(cfg))
j['packageClassList'] = ((j['packageClassList'] || []) + ['DescansoPlugin']).uniq
File.write(cfg, JSON.pretty_generate(j))

# La app declara que usa tarjetas en la pantalla de bloqueo ("actividades en vivo").
plist = File.join(dir, 'App', 'Info.plist')
x = File.read(plist)
unless x.include?('NSSupportsLiveActivities')
  fin = x.rindex('</dict>')
  x = x[0...fin] + "\t<key>NSSupportsLiveActivities</key>\n\t<true/>\n" + x[fin..]
  File.write(plist, x)
end

proj = Xcodeproj::Project.open(File.join(dir, 'App.xcodeproj'))
app = proj.targets.find { |t| t.name == 'App' }
abort 'No encontré el destino App' unless app
if proj.targets.any? { |t| t.name == 'MiGymWidget' }
  puts 'El widget ya estaba agregado'
  exit 0
end

# 1. Archivos de la app
grupo = proj.main_group['App']
refs = %w[DescansoAttributes.swift DescansoPlugin.swift].map do |f|
  FileUtils.cp(File.join(fuentes, f), File.join(dir, 'App', f))
  grupo.new_file(f)
end
app.add_file_references(refs)

# 2. Widget
wdir = File.join(dir, 'MiGymWidget')
FileUtils.mkdir_p(wdir)
%w[MiGymWidget.swift DescansoAttributes.swift].each { |f| FileUtils.cp(File.join(fuentes, f), File.join(wdir, f)) }
FileUtils.cp(File.join(fuentes, 'widget-Info.plist'), File.join(wdir, 'Info.plist'))
w = proj.new_target(:app_extension, 'MiGymWidget', :ios, '16.2', nil, :swift)
w.frameworks_build_phase.clear
g = proj.main_group.new_group('MiGymWidget', 'MiGymWidget')
w.add_file_references([g.new_file('MiGymWidget.swift'), g.new_file('DescansoAttributes.swift')])
g.new_file('Info.plist')

base = app.build_configurations.first.build_settings
id_app = base['PRODUCT_BUNDLE_IDENTIFIER'] || 'io.github.marii0.migym'
w.build_configurations.each do |c|
  s = c.build_settings
  s['PRODUCT_BUNDLE_IDENTIFIER'] = "#{id_app}.widget"
  s['PRODUCT_NAME'] = '$(TARGET_NAME)'
  s['INFOPLIST_FILE'] = 'MiGymWidget/Info.plist'
  s['GENERATE_INFOPLIST_FILE'] = 'NO'
  s['SDKROOT'] = 'iphoneos'
  s['IPHONEOS_DEPLOYMENT_TARGET'] = '16.2'
  s['TARGETED_DEVICE_FAMILY'] = '1,2'
  s['SWIFT_VERSION'] = '5.0'
  s['MARKETING_VERSION'] = base['MARKETING_VERSION'] || '1.0'
  s['CURRENT_PROJECT_VERSION'] = base['CURRENT_PROJECT_VERSION'] || '1'
  s['CODE_SIGN_STYLE'] = 'Automatic'
  s['SKIP_INSTALL'] = 'YES'
  s['APPLICATION_EXTENSION_API_ONLY'] = 'YES'
  s['LD_RUNPATH_SEARCH_PATHS'] = ['$(inherited)', '@executable_path/Frameworks', '@executable_path/../../Frameworks']
end

# 3. El widget viaja dentro de la app (carpeta PlugIns)
app.add_dependency(w)
meter = app.new_copy_files_build_phase('Embed Foundation Extensions')
meter.symbol_dst_subfolder_spec = :plug_ins
archivo = meter.add_file_reference(w.product_reference, true)
archivo.settings = { 'ATTRIBUTES' => ['RemoveHeadersOnCopy'] }
# Antes de los pasos de script (los de CocoaPods), para que Xcode no reporte un ciclo.
despues = app.build_phases.index(app.resources_build_phase)
app.build_phases.move(meter, despues + 1) if despues

proj.save
puts "Widget agregado: #{id_app}.widget, versión #{base['MARKETING_VERSION']}"
