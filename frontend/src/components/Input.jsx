import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { theme } from '../styles/theme';

export default function Input({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry = false,
  keyboardType = 'default',
  autoCapitalize = 'none',
  error,
  testID,
  rightHeaderAction,
  leftIcon,
  rightIcon,
  onRightIconPress,
}) {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        {label ? <Text style={styles.label}>{label}</Text> : <View />}
        {rightHeaderAction || null}
      </View>
      <View
        style={[
          styles.inputWrapper,
          isFocused && styles.inputWrapperFocused,
          error ? styles.inputWrapperError : null,
        ]}
      >
        {leftIcon ? <View style={styles.leftIconContainer}>{leftIcon}</View> : null}
        <TextInput
          testID={testID}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={theme.colors.textMuted}
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          style={styles.input}
        />
        {rightIcon ? (
          <TouchableOpacity
            onPress={onRightIconPress}
            activeOpacity={0.7}
            style={styles.rightIconContainer}
            testID={testID ? `${testID}-toggle-visibility` : undefined}
          >
            {rightIcon}
          </TouchableOpacity>
        ) : null}
      </View>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: theme.spacing.md,
    width: '100%',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  label: {
    ...theme.typography.label,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    height: 52,
    borderWidth: 1.5,
    borderColor: theme.colors.inputBorder,
    borderRadius: theme.borderRadius.input,
    paddingHorizontal: theme.spacing.md,
    backgroundColor: theme.colors.inputBackground,
  },
  inputWrapperFocused: {
    borderColor: theme.colors.inputBorderFocus,
  },
  inputWrapperError: {
    borderColor: theme.colors.error,
  },
  leftIconContainer: {
    marginRight: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rightIconContainer: {
    marginLeft: 8,
    padding: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    height: '100%',
    fontSize: theme.typography.input.fontSize,
    fontWeight: theme.typography.input.fontWeight,
    color: theme.colors.textPrimary,
  },
  errorText: {
    marginTop: theme.spacing.xs,
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.error,
  },
});
