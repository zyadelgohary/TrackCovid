// This screen will be the one that displays information about the currently selected location.
// It will use the StatsCard component to show different current statistics about the virus
import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, FlatList, RefreshControl } from 'react-native';
import StatsCard from '../../components/StatsCard/StatsCard';
import fontStyles from '../../config/fontStyles';
import StatsScreenStyle from './StatsScreenStyle';
import colors from '../../config/colors';
import LoadingSpinner from '../../components/LoadingSpinner';
import strings from '../../config/strings';
import World from '../../classes/World';
import Country from '../../classes/Country';
import { Icon } from 'react-native-elements';
import { getUpdatedMessage, getConstructedData } from './FunctionHelpers';
import analytics from '@react-native-firebase/analytics';
import crashlytics from '@react-native-firebase/crashlytics';


// Creates the functional component
const StatsScreen = ({ route, navigation }) => {
	// The state fields for this screen
	const [isLoading, setIsLoading] = useState(true);
	const [isRefreshing, setIsRefreshing] = useState(false);
	const [data, setData] = useState({});
	const [pageTitle, setPageTitle] = useState('');
	const [lastUpdated, setLastUpdated] = useState('');
	const [isGlobalView, setIsGlobalView] = useState(route.params ? false : true);

	// The useEffect method. This will check which data to fetch. It will fetch global data as a default unless
	// a specific location is selected.
	useEffect(() => {
		setIsLoading(true);
		fetchFunc();
	}, [isGlobalView]);

	// This is a helper function for useEffect because useEffect cannot be asynchronous
	const fetchFunc = async () => {

		// If a location is set, shows data for it. If none is set, shows global data
		if (isGlobalView === false) {

			// Fetches the country from the route params
			const { country } = route.params;

			// Sets the screen Analytics for Firebase and the neccessary Firebase Crashlytics attributes
			analytics().setCurrentScreen('Location Stats Screen', 'StatsScreen');
			await crashlytics().setAttribute('searchedItem', country.name);

			// Uses a try-catch statement to log any possible crashes to Firebase Crashlytics. If there is an
			// error, navigates to a screen to let the user know that the developers are working on it
			try {
				const countryObject = new Country(country.name, country.code);
				await countryObject.initializeBasicData();
				const countryData = countryObject.getBasicData();
				const updatedMessage = getUpdatedMessage(countryData.updated);
				const constructedData = getConstructedData(countryData);
				setLastUpdated(updatedMessage);
				setData(constructedData);
				setPageTitle(country.name);
				setIsLoading(false);
				setIsRefreshing(false);
			} catch (error) {
				crashlytics().recordError(error);
				navigation.push('ErrorScreen');
			}
		} else {
			// Sets the screen Analytics for Firebase
			analytics().setCurrentScreen('Global Stats Screen', 'StatsScreen');
			analytics().logEvent('global', {});
			await crashlytics().setAttribute('searchedItem', 'Global');

			// Uses a try-catch statement to log any possible crashes to Firebase Crashlytics. If there is an
			// error, navigates to a screen to let the user know that the developers are working on it
			try {
				const global = new World();
				await global.initializeBasicData();

				// Fetches all the fields it needs to
				const globalData = global.getBasicData();
				const updatedMessage = getUpdatedMessage(globalData.updated);
				const constructedData = getConstructedData(globalData);

				setLastUpdated(updatedMessage);
				setData(constructedData);
				setPageTitle(strings.Global);
				setIsLoading(false);
				setIsRefreshing(false);
			} catch (error) {
				crashlytics().recordError(error);
				navigation.push('ErrorScreen');
			}
		}
	};

	// Renders the loading state for this screen
	if (isLoading === true) {
		return (
			<View style={StatsScreenStyle.loadingContainer}>
				<LoadingSpinner isVisible={true} />
			</View>
		);
	}

	// Returns the UI of the screen
	return (
		<View style={StatsScreenStyle.screenBackground}>
			<FlatList
				data={data}
				showsHorizontalScrollIndicator={false}
				showsVerticalScrollIndicator={false}
				refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={() => fetchFunc()} />}
				ListHeaderComponent={
					isGlobalView === true ? (
						<View>
							<TouchableOpacity
								style={[StatsScreenStyle.iconContainer, StatsScreenStyle.iconMarginTop]}
								onPress={() => {
									navigation.push('SearchScreen');
								}}>
								<Icon name='search' type='font-awesome' color={colors.lightPurple} />
							</TouchableOpacity>
							<View style={StatsScreenStyle.titleContainer}>
								<Text
									style={[fontStyles.bigTitleTextStyle, fontStyles.lightPurple, fontStyles.bold]}>
									{pageTitle}
								</Text>
							</View>
							<View style={StatsScreenStyle.updatedContainer}>
								<Text style={[fontStyles.subTextStyle, fontStyles.lightPurple]}>{lastUpdated}</Text>
							</View>
						</View>
					) : (
						<View>
							<View style={StatsScreenStyle.iconRow}>
								<TouchableOpacity
									style={StatsScreenStyle.iconRowContainer}
									onPress={() => {
										setIsGlobalView(true);
									}}>
									<Icon name='globe' type='font-awesome' color={colors.lightPurple} />
								</TouchableOpacity>
								<TouchableOpacity
									style={StatsScreenStyle.iconRowContainer}
									onPress={() => {
										navigation.push('SearchScreen');
									}}>
									<Icon name='search' type='font-awesome' color={colors.lightPurple} />
								</TouchableOpacity>
							</View>
							<View style={StatsScreenStyle.titleContainer}>
								<Text
									style={[fontStyles.bigTitleTextStyle, fontStyles.lightPurple, fontStyles.bold]}>
									{pageTitle}
								</Text>
							</View>
							<View style={StatsScreenStyle.updatedContainer}>
								<Text style={[fontStyles.subTextStyle, fontStyles.lightPurple]}>{lastUpdated}</Text>
							</View>
						</View>
					)
				}
				keyExtractor={(item, index) => index}
				numColumns={2}
				renderItem={({ item, index }) => (
					<View style={StatsScreenStyle.statCardContainer}>
						<StatsCard
							statTitle={item.title}
							statNumber={item.number}
							indicatorColor={item.indicatorColor}
						/>
					</View>
				)}
				ListFooterComponent={
					<View>
						<TouchableOpacity
							onPress={() => navigation.push('SettingsScreen')}
							style={[StatsScreenStyle.iconContainer, StatsScreenStyle.iconMarginBottom]}>
							<Icon name='gears' type='font-awesome' color={colors.lightPurple} />
						</TouchableOpacity>
					</View>
				}
			/>
		</View>
	);
};

// Exports the component
export default StatsScreen;
